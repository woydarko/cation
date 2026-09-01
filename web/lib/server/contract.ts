import "server-only";
import { Client, networks } from "prize-pool-client";
import { Client as UsdcClient } from "usdc-client";
import { rpc } from "@stellar/stellar-sdk";
import { RPC_URL, NETWORK_PASSPHRASE, PRIZE_POOL_ID, USDC_SAC } from "../config";

function client(): Client {
  return new Client({
    contractId: PRIZE_POOL_ID,
    networkPassphrase: networks.testnet.networkPassphrase ?? NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
  });
}

const s = (v: bigint | number | undefined) => (v ?? 0n).toString();

export type PoolState = {
  pot: string;
  totalPrincipal: string;
  totalTickets: string;
  epoch: number;
  penaltyBps: number;
  nextDrawLedger: number;
  currentLedger: number;
  serverTime: number; // ms epoch, for a clock-synced countdown
  user?: { balance: string; tickets: string; usdcBalance: string };
};

export async function readPoolState(user?: string): Promise<PoolState> {
  const c = client();
  const server = new rpc.Server(RPC_URL);

  const [pot, principal, tickets, cfg, latest] = await Promise.all([
    c.pot().then((t) => t.result),
    c.total_principal_view().then((t) => t.result),
    c.total_tickets().then((t) => t.result),
    c.get_config().then((t) => t.result),
    server.getLatestLedger(),
  ]);

  const state: PoolState = {
    pot: s(pot),
    totalPrincipal: s(principal),
    totalTickets: s(tickets),
    epoch: Number(cfg.epoch),
    penaltyBps: Number(cfg.penalty_bps),
    nextDrawLedger: Number(cfg.next_draw_ledger),
    currentLedger: latest.sequence,
    serverTime: Date.now(),
  };

  if (user) {
    const usdc = new UsdcClient({
      contractId: USDC_SAC,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
    });
    const [bal, utix, wallet] = await Promise.all([
      c.balance_of({ user }).then((t) => t.result),
      c.tickets_of({ user }).then((t) => t.result),
      usdc.balance({ id: user }).then((t) => t.result).catch(() => 0n),
    ]);
    state.user = { balance: s(bal), tickets: s(utix), usdcBalance: s(wallet) };
  }
  return state;
}

/**
 * Whether the user's position is currently locked, detected by simulating a
 * full-balance strict withdraw (read-only, no signing). A locked position makes
 * the contract reject with StillLocked (#6) during simulation — unlike reading
 * the deposit event, this has no RPC ledger-window limit, so day-old locks are
 * still detected.
 *
 * ponytail: simulation tells us locked-or-not but not the unlock ledger. A
 * precise "unlocks in N days" needs a deposit_of view, deferred so we don't
 * redeploy (and reset) the live testnet pool.
 */
export async function readLockStatus(user: string): Promise<boolean> {
  const c = client();
  const bal = await c.balance_of({ user }).then((t) => t.result);
  if (bal <= 0n) return false;
  try {
    await c.withdraw({ to: user, amount: bal, force_early: false });
    return false; // a strict withdraw simulates cleanly -> not locked
  } catch (e) {
    const msg = String(e);
    // Only assert a lock we can actually prove; swallow unrelated sim errors.
    return msg.includes("#6") || /lock/i.test(msg);
  }
}
