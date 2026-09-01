import "server-only";
import { rpc, xdr, scValToNative, nativeToScVal, Address } from "@stellar/stellar-sdk";
import { RPC_URL, PRIZE_POOL_ID } from "../config";
import { dedupeActivity, type ActivityRow } from "./activity-merge";

export type { ActivityRow };

// Event names the contract emits, keyed by user address on topic[1].
const KINDS = ["deposit", "withdraw", "earlyexit", "claim"] as const;

/**
 * A user's on-chain activity, newest first, read from contract events via RPC.
 * ponytail: getEvents scans ~9000 ledgers (~12h on testnet), so older activity
 * is not returned. Upgrade path when history matters: an indexer / subgraph.
 */
export async function readUserActivity(user: string, limit = 40): Promise<ActivityRow[]> {
  const server = new rpc.Server(RPC_URL);
  const latest = (await server.getLatestLedger()).sequence;
  const startLedger = Math.max(1, latest - 9000);

  const userTopic = Address.fromString(user).toScVal().toXDR("base64");
  const sym = (s: string) => nativeToScVal(s, { type: "symbol" }).toXDR("base64");

  const res = await server.getEvents({
    startLedger,
    filters: KINDS.map((k) => ({
      type: "contract" as const,
      contractIds: [PRIZE_POOL_ID],
      topics: [[sym(k), userTopic]],
    })),
    limit: 100,
  });

  const toScVal = (t: unknown): xdr.ScVal =>
    typeof t === "string" ? xdr.ScVal.fromXDR(t, "base64") : (t as xdr.ScVal);

  const rows: ActivityRow[] = [];
  for (const e of res.events) {
    try {
      const topics = e.topic as unknown[];
      const name = scValToNative(toScVal(topics[0])) as string;
      const v = scValToNative(toScVal(e.value)) as unknown[];
      const base = { ledger: e.ledger, at: e.ledgerClosedAt, txHash: e.txHash };
      if (name === "deposit") {
        rows.push({ kind: "deposit", amount: String(v[0]), lockUntil: Number(v[1]) || undefined, ...base });
      } else if (name === "withdraw") {
        rows.push({ kind: "withdraw", amount: String(v[0]), ...base });
      } else if (name === "earlyexit") {
        rows.push({ kind: "earlyexit", amount: String(v[0]), penalty: String(v[1]), ...base });
      } else if (name === "claim") {
        // claim = the prize actually landing in the winner's wallet.
        rows.push({ kind: "win", amount: String(v[0]), epoch: Number(v[1]), ...base });
      }
    } catch {
      // skip anything that does not decode as one of our events
    }
  }
  return dedupeActivity(rows).slice(0, limit);
}
