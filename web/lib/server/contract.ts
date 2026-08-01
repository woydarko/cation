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
