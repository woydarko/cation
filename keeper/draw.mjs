// Cation draw keeper.
//
// Runs the daily draw for one PrizePool. When the draw window is open it:
//   1. commits a hashed random seed,
//   2. waits a few ledgers so the mixed-in ledger entropy is unknown at commit,
//   3. reveals the seed to pick a ticket-weighted winner (records the prize),
//   4. claims the prize so the winner is paid.
//
// reveal and claim are split on purpose: the winner is chosen from
// execution-time ledger entropy, so it is unknown when reveal is simulated and
// the winner's trustline cannot be in that transaction's footprint. claim_prize
// pays out where the winner is already fixed in storage, so its footprint is
// correct. Both are plain contract calls — no hand-built footprints.
//
// Designed for a scheduled cron (GitHub Actions). No-ops until the draw window
// is open, so frequent runs are safe.
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

// Pay out an outstanding prize, but only when one actually exists. claim_prize
// returns the winner when there is a prize to pay and the contract's own
// address when there is nothing pending, so we simulate first and submit a tx
// only in the former case. This keeps empty-pot draws from failing, avoids a
// no-op tx every run, and self-heals a prize a previous run left unpaid (an
// unclaimed prize blocks the next draw, so sweeping it also unblocks draws).
async function sweepPrize(label) {
  const tx = await withRetry(`${label} (simulate)`, async () => client.claim_prize());
  const winner = tx.result;
  if (!winner || winner === POOL_ID) {
    return null; // nothing pending
  }
  console.log(`${label}: paying out to ${winner}…`);
  await withRetry(`${label} (send)`, async () => tx.signAndSend());
  return winner;
}

async function main() {
  const cfg = (await client.get_config()).result;
  // The contract gates the draw on ledger close time, which tracks wall clock,
  // so compare against the current unix time. next_draw_ts is a UTC-midnight
  // boundary, making the draw fire daily at 00:00 UTC.
  const nowTs = Math.floor(Date.now() / 1000);
  console.log(`epoch=${cfg.epoch} next_draw_ts=${cfg.next_draw_ts} now=${nowTs}`);

  // Clear any prize a prior run couldn't finish before doing anything else.
  await sweepPrize("sweep");

  if (nowTs < Number(cfg.next_draw_ts)) {
    console.log(`draw not due (${Number(cfg.next_draw_ts) - nowTs}s to go)`);
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
  const revealed = await withRetry("reveal", async () =>
    (await client.reveal_draw({ seed })).signAndSend()
  );
  const winner = revealed.result;

  // Pay the fresh prize. An empty-pot draw records no prize, so this is a no-op
  // (no tx) and the run still succeeds.
  const paid = await sweepPrize("claim");

  const pot = (await client.pot()).result;
  console.log(
    `draw done. winner=${winner} ${paid ? `paid=${paid}` : "(empty pot, no payout)"}. ` +
      `epoch is now ${cfg.epoch + 1}. pot now ${pot}.`
  );
}

main().catch((e) => {
  console.error("keeper failed:", e?.stack ?? e?.message ?? e);
  process.exit(1);
});
