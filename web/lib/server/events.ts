import "server-only";
import { rpc, xdr, scValToNative, nativeToScVal } from "@stellar/stellar-sdk";
import { RPC_URL, PRIZE_POOL_ID } from "../config";

export type DrawRecord = {
  epoch: number;
  winner: string;
  amount: string; // stroops
  ledger: number;
  at: string; // ISO timestamp
};

/** Read past `draw` events for the pool via RPC getEvents, newest first. */
export async function readDrawHistory(limit = 25): Promise<DrawRecord[]> {
  const server = new rpc.Server(RPC_URL);
  const latest = (await server.getLatestLedger()).sequence;
  // getEvents scans forward from startLedger up to an RPC-internal cap (~10k
  // ledgers) per call, so start inside that cap to catch the recent draws.
  const startLedger = Math.max(1, latest - 9000);

  const drawTopic = nativeToScVal("draw", { type: "symbol" }).toXDR("base64");

  const res = await server.getEvents({
    startLedger,
    filters: [
      {
        type: "contract",
        contractIds: [PRIZE_POOL_ID],
        topics: [[drawTopic, "*"]],
      },
    ],
    limit: 100,
  });

  const toScVal = (t: unknown): xdr.ScVal =>
    typeof t === "string" ? xdr.ScVal.fromXDR(t, "base64") : (t as xdr.ScVal);

  const draws: DrawRecord[] = [];
  for (const e of res.events) {
    try {
      const topics = e.topic as unknown[];
      const winner = scValToNative(toScVal(topics[1])) as string;
      const value = scValToNative(toScVal(e.value)) as [bigint, number];
      draws.push({
        winner,
        amount: value[0].toString(),
        epoch: Number(value[1]),
        ledger: e.ledger,
        at: e.ledgerClosedAt,
      });
    } catch {
      // skip anything that does not decode as a draw event
    }
  }
  draws.sort((a, b) => b.epoch - a.epoch);
  return draws.slice(0, limit);
}
