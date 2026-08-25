// Cation draw keeper.
//
// Runs the daily draw for one PrizePool: when the draw window is open, it
// commits a hashed random seed, waits a few ledgers so the mixed-in ledger
// entropy is not known at commit time, then reveals to pick and pay the winner.
//
// Designed to be invoked on a schedule (serverless cron / GitHub Actions).
// Idempotent-ish: if the draw is not yet due it exits cleanly; if a commit
// already exists it goes straight to reveal.
//
// Footprint note: reveal_draw picks the winner from execution-time ledger
// entropy, so the winner is not known at simulation time and the generated
// client's auto-footprint omits the real winner's USDC trustline (the tx then
// traps with "trying to access account trustline outside of the footprint").
// We build reveal_draw by hand and add EVERY saver's USDC trustline to the
// footprint, so whichever saver wins, their trustline is present.
//
// Env:
//   KEEPER_SECRET   S… secret of the admin/keeper key
//   POOL_ID         C… PrizePool contract id
//   RPC_URL         (default testnet)
//   NETWORK_PASSPHRASE (default testnet)
//   USDC_CODE / USDC_ISSUER  the prize asset (default Circle testnet USDC)
import { createHash, randomBytes } from "node:crypto";
import {
  Keypair,
  rpc,
  contract as contractNS,
  Contract,
  TransactionBuilder,
  Operation,
  xdr,
  Address,
  Asset,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { Client } from "prize-pool-client";

const RPC_URL = process.env.RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const POOL_ID = process.env.POOL_ID;
const KEEPER_SECRET = process.env.KEEPER_SECRET;
const USDC_CODE = process.env.USDC_CODE ?? "USDC";
const USDC_ISSUER =
  process.env.USDC_ISSUER ??
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const COMMIT_REVEAL_GAP = Number(process.env.COMMIT_REVEAL_GAP ?? 3); // ledgers

if (!POOL_ID || !KEEPER_SECRET) {
  console.error("set POOL_ID and KEEPER_SECRET");
  process.exit(1);
}

const keeper = Keypair.fromSecret(KEEPER_SECRET);
const signer = contractNS.basicNodeSigner(keeper, NETWORK_PASSPHRASE);
const server = new rpc.Server(RPC_URL);
const usdc = new Asset(USDC_CODE, USDC_ISSUER);

const client = new Client({
  contractId: POOL_ID,
  rpcUrl: RPC_URL,
  networkPassphrase: NETWORK_PASSPHRASE,
  publicKey: keeper.publicKey(),
  signTransaction: signer.signTransaction,
});

const ledger = () => server.getLatestLedger().then((l) => l.sequence);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Testnet RPC is occasionally flaky (transient "Account not found", timeouts).
// Retry a few times so an unattended cron run does not fail spuriously.
async function withRetry(label, fn, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.warn(`${label} attempt ${i + 1} failed: ${e?.message ?? e}`);
      await sleep(2500);
    }
  }
  throw last;
}

// Read the contract's saver list straight from instance storage (DataKey::Savers
// serializes as ScVal::Vec([Symbol("Savers")])). Not exposed as a view method.
async function readSavers() {
  const key = xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: new Address(POOL_ID).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    })
  );
  const r = await server.getLedgerEntries(key);
  const storage = r.entries[0].val.contractData().val().instance().storage() ?? [];
  for (const e of storage) {
    const k = e.key();
    if (k.switch().name !== "scvVec") continue;
    const v = k.vec();
    if (v?.length === 1 && v[0].switch().name === "scvSymbol" && v[0].sym().toString() === "Savers") {
      return scValToNative(e.val());
    }
  }
  return [];
}

function trustlineKey(g) {
  return xdr.LedgerKey.trustline(
    new xdr.LedgerKeyTrustLine({
      accountId: Keypair.fromPublicKey(g).xdrAccountId(),
      asset: usdc.toTrustLineXDRObject(),
    })
  );
}

// Build reveal_draw by hand and widen the footprint to cover every saver's USDC
// trustline, then sign and send. Returns the winner address.
async function revealDraw(seed) {
  const savers = await readSavers();
  // ponytail: only classic (G…) savers get a trustline key; a smart-wallet
  // (C…) winner would need its SAC balance entry instead. All current savers
  // are G-accounts. Upgrade path: add C-address balance keys when we ship
  // contract wallets.
  const extra = savers.filter((a) => a.startsWith("G")).map(trustlineKey);
  const seedScVal = nativeToScVal(Buffer.from(seed), { type: "bytes" });
  const call = () => new Contract(POOL_ID).call("reveal_draw", seedScVal);

  const simSource = await server.getAccount(keeper.publicKey());
  const base = new TransactionBuilder(simSource, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(call())
    .setTimeout(120)
    .build();
  const sim = await server.simulateTransaction(base);
  if (rpc.Api.isSimulationError(sim)) throw new Error(`simulate reveal_draw: ${sim.error}`);

  const sd = sim.transactionData;
  // Merge without duplicates: the simulated winner's trustline is already in
  // the footprint, and a duplicate ledger key is rejected by the host.
  const rw = sd.getReadWrite();
  const seen = new Set([...rw, ...sd.getReadOnly()].map((k) => k.toXDR("base64")));
  const toAdd = extra.filter((k) => !seen.has(k.toXDR("base64")));
  sd.setReadWrite([...rw, ...toAdd]);
  // The extra footprint entries are read at execution, so the DECLARED
  // resources (not just the fee) must cover them or the tx trips
  // resourceLimitExceeded. Bump generously; margins are well under network max.
  const res = sd.build().resources();
  sd.setResources(
    res.instructions() + 10_000_000,
    res.diskReadBytes() + 5_000 + toAdd.length * 500,
    res.writeBytes() + 4_000
  );
  const resourceFee = BigInt(sim.minResourceFee) + 8_000_000n; // margin for the extra reads + resources
  sd.setResourceFee(resourceFee);

  // Re-attach the auth the simulation derived (admin.require_auth). Building the
  // op by hand drops it, which traps reveal_draw with require_auth. admin ==
  // keeper == source, so the tx signature authorizes these source-account
  // credentials; we just have to carry the entries on the op.
  const func = call().body().invokeHostFunctionOp().hostFunction();
  const authedOp = Operation.invokeHostFunction({ func, auth: sim.result?.auth ?? [] });

  const source = await server.getAccount(keeper.publicKey());
  const tx = new TransactionBuilder(source, {
    fee: (resourceFee + 100_000n).toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(authedOp)
    .setSorobanData(sd.build())
    .setTimeout(120)
    .build();
  tx.sign(keeper);

  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") throw new Error(`send reveal: ${JSON.stringify(sent.errorResult ?? sent)}`);
  let got;
  for (let i = 0; i < 25; i++) {
    await sleep(2000);
    got = await server.getTransaction(sent.hash);
    if (got.status !== "NOT_FOUND") break;
  }
  if (got?.status !== "SUCCESS") throw new Error(`reveal tx failed: ${JSON.stringify(got?.resultXdr ?? got?.status)}`);
  return scValToNative(got.returnValue);
}

async function main() {
  const cfg = (await client.get_config()).result;
  const now = await ledger();
  console.log(`epoch=${cfg.epoch} next_draw_ledger=${cfg.next_draw_ledger} current=${now}`);

  if (now < Number(cfg.next_draw_ledger)) {
    console.log(`draw not due (${Number(cfg.next_draw_ledger) - now} ledgers to go)`);
    return;
  }

  // Commit a fresh hashed seed.
  const seed = randomBytes(32);
  const seedHash = createHash("sha256").update(seed).digest();
  console.log("committing draw…");
  await withRetry("commit", async () =>
    (await client.commit_draw({ seed_hash: seedHash })).signAndSend()
  );

  // Let a few ledgers pass so reveal-time ledger entropy is unknown at commit.
  const target = (await ledger()) + COMMIT_REVEAL_GAP;
  while ((await ledger()) < target) await sleep(3000);

  console.log("revealing draw…");
  const winner = await withRetry("reveal", async () => revealDraw(seed));
  const pot = (await client.pot()).result;
  console.log(`draw done. winner=${winner}. epoch is now ${cfg.epoch + 1}. pot reset (now ${pot}).`);
}

main().catch((e) => {
  console.error("keeper failed:", e?.stack ?? e?.message ?? e);
  process.exit(1);
});
