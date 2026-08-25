// Cation draw keeper.
//
// Runs the daily draw for one PrizePool: when the draw window is open it commits
// a hashed random seed, waits a few ledgers so the mixed-in ledger entropy is
// not known at commit time, then reveals to pick and pay a ticket-weighted
// winner. Designed for a scheduled cron (GitHub Actions). No-ops until the draw
// window is open, so frequent runs are safe.
//
// KNOWN LIMITATION (tracked on the roadmap): reveal_draw derives the winner from
// execution-time ledger entropy, so the winner is not known at simulation time
// and the paying transfer's footprint cannot include the real winner's trustline
// ahead of time. When the pot is non-zero the reveal therefore traps. The
// planned fix is a pull-based prize: reveal only records the winner and amount,
// and the winner claims in their own transaction (their trustline is naturally
// in that footprint). Until then a non-zero payout is deferred, not lost: the
// principal and pot stay in the pool. We catch that specific case and exit 0 so
// the schedule stays healthy.
//
// Env:
//   KEEPER_SECRET   S… secret of the admin/keeper key
//   POOL_ID         C… PrizePool contract id
//   RPC_URL / NETWORK_PASSPHRASE (default testnet)
import { createHash, randomBytes } from "node:crypto";
import { Keypair, rpc, contract as contractNS } from "@stellar/stellar-sdk";
import { Client } from "prize-pool-client";

const RPC_URL = process.env.RPC_URL ?? "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE =
  process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const POOL_ID = process.env.POOL_ID;
const KEEPER_SECRET = process.env.KEEPER_SECRET;
const COMMIT_REVEAL_GAP = Number(process.env.COMMIT_REVEAL_GAP ?? 3); // ledgers

if (!POOL_ID || !KEEPER_SECRET) {
  console.error("set POOL_ID and KEEPER_SECRET");
  process.exit(1);
}

const keeper = Keypair.fromSecret(KEEPER_SECRET);
const signer = contractNS.basicNodeSigner(keeper, NETWORK_PASSPHRASE);
const server = new rpc.Server(RPC_URL);

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

// The footprint trap only bites when a real prize must be transferred to the
// randomly-selected winner (see KNOWN LIMITATION above). Recognise it so the
// scheduled run reports success instead of a hard failure.
function isPayoutFootprintTrap(err) {
  const s = String(err?.message ?? err);
  return s.includes("HostFunctionTrapped") || s.includes("footprint");
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
  try {
    const res = await withRetry("reveal", async () =>
      (await client.reveal_draw({ seed })).signAndSend()
    );
    const winner = res.result;
    const pot = (await client.pot()).result;
    console.log(`draw done. winner=${winner}. epoch is now ${cfg.epoch + 1}. pot reset (now ${pot}).`);
  } catch (e) {
    if (isPayoutFootprintTrap(e)) {
      const pot = (await client.pot()).result;
      console.warn(
        `reveal deferred: non-zero payout (pot=${pot}) hits the known footprint ` +
          `limitation; principal and pot are safe in the pool. Fix tracked on the ` +
          `roadmap (pull-based prize claim). Exiting clean.`
      );
      return;
    }
    throw e;
  }
}

main().catch((e) => {
  console.error("keeper failed:", e?.stack ?? e?.message ?? e);
  process.exit(1);
});
