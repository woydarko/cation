// Runnable self-check for the activity dedup/order logic.
// Run: node web/lib/server/activity-merge.check.ts  (Node 24 strips the types)
import assert from "node:assert";
import { dedupeActivity, type ActivityRow } from "./activity-merge.ts";

const mk = (
  kind: ActivityRow["kind"],
  txHash: string,
  ledger: number
): ActivityRow => ({ kind, amount: "0", ledger, at: "", txHash });

const rows = [
  mk("deposit", "t1", 10),
  mk("earlyexit", "t2", 20),
  mk("withdraw", "t2", 20), // same tx as the early exit -> dropped
  mk("withdraw", "t3", 30), // a plain withdraw -> kept
];

const out = dedupeActivity(rows);

assert.equal(out.length, 3, "the early-exit's paired withdraw is removed");
assert.equal(out[0].ledger, 30, "newest first");
assert.ok(
  !out.some((r) => r.kind === "withdraw" && r.txHash === "t2"),
  "duplicate withdraw gone"
);
assert.ok(
  out.some((r) => r.kind === "earlyexit" && r.txHash === "t2"),
  "early exit kept"
);

console.log("activity-merge: ok");
