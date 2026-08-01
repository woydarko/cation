import { USDC_DECIMALS } from "./config";

const SCALE = 10 ** USDC_DECIMALS;

/** Stroops (i128 string/bigint) -> human USDC number. */
export function toUsdc(stroops: string | bigint): number {
  return Number(BigInt(stroops)) / SCALE;
}

/** Human USDC amount -> stroops string for contract calls. */
export function toStroops(usdc: number): string {
  return BigInt(Math.round(usdc * SCALE)).toString();
}

export function formatUsdc(stroops: string | bigint, maxFrac = 2): string {
  return toUsdc(stroops).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  });
}

/** Seconds until the next 00:00 UTC (the daily draw time). Pass a server
 * timestamp (ms) to stay in sync across users regardless of device clock. */
export function secondsToNextUtcMidnight(nowMs: number = Date.now()): number {
  const now = new Date(nowMs);
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0
  );
  return Math.max(0, Math.floor((next - nowMs) / 1000));
}

export function formatCountdown(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/** Odds as a percentage string, guarding divide-by-zero. */
export function oddsPct(userTickets: string | bigint, total: string | bigint): string {
  const t = Number(BigInt(total));
  if (t === 0) return "0";
  // user and total tickets are read in separate simulations at slightly
  // different ledgers, and weight grows per ledger, so the ratio can drift
  // just past 100% for a dominant saver. Clamp to a sane range.
  const pct = Math.min(100, (Number(BigInt(userTickets)) / t) * 100);
  if (pct > 0 && pct < 0.1) return "<0.1";
  return pct.toFixed(1);
}
