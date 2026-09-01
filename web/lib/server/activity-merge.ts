// Pure shaping for a user's on-chain activity feed. No network, no server-only
// imports, so it stays unit-testable (see activity-merge.check.ts).

export type ActivityKind = "deposit" | "withdraw" | "earlyexit" | "win";

export type ActivityRow = {
  kind: ActivityKind;
  amount: string; // stroops: principal moved, or prize received for a win
  penalty?: string; // stroops, early-exit only
  lockUntil?: number; // ledger the deposit is locked until, deposit only
  epoch?: number; // draw epoch, win only
  ledger: number;
  at: string; // ISO timestamp
  txHash: string;
};

/**
 * An early exit emits both `earlyexit` and `withdraw` in the same transaction.
 * Collapse to the single earlyexit row (it carries the penalty) so the user
 * sees one action, then order newest-first.
 */
export function dedupeActivity(rows: ActivityRow[]): ActivityRow[] {
  const earlyTx = new Set(
    rows.filter((r) => r.kind === "earlyexit").map((r) => r.txHash)
  );
  return rows
    .filter((r) => !(r.kind === "withdraw" && earlyTx.has(r.txHash)))
    .sort((a, b) => b.ledger - a.ledger);
}
