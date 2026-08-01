"use client";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { HanaModule } from "@creit.tech/stellar-wallets-kit/modules/hana";
import { Client as PoolClient } from "prize-pool-client";
import { Client as UsdcClient } from "usdc-client";
import { TransactionBuilder, Operation, Asset, BASE_FEE, rpc } from "@stellar/stellar-sdk";
import {
  RPC_URL,
  NETWORK_PASSPHRASE,
  FRIENDBOT_URL,
  PRIZE_POOL_ID,
  USDC_SAC,
  USDC_CODE,
  USDC_ISSUER,
} from "../config";

const CONNECTED_KEY = "cation.connected";
const WALLET_ID_KEY = "cation.walletId";

// Match the wallet modal to the Cation design system.
const CATION_THEME = {
  background: "#ffffff",
  "background-secondary": "#f5f6ff",
  "foreground-strong": "#141234",
  foreground: "#141234",
  "foreground-secondary": "#6b6a82",
  primary: "#6c4cf1",
  "primary-foreground": "#ffffff",
  transparent: "transparent",
  lighter: "#ffffff",
  light: "#f5f6ff",
  "light-gray": "#ecebf3",
  gray: "#d9d8e4",
  danger: "#ff7a5c",
  border: "#e4e3ec",
  shadow: "rgba(20,18,52,0.18)",
  "border-radius": "1rem",
  "font-family": "'General Sans', ui-sans-serif, system-ui, sans-serif",
};

let inited = false;
function kit() {
  if (!inited) {
    // A curated module list (fewer window probes than the full default set)
    // to reduce conflicts with installed browser extensions.
    StellarWalletsKit.init({
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new LobstrModule(),
        new AlbedoModule(),
        new HanaModule(),
      ],
      network: Networks.TESTNET,
      theme: CATION_THEME,
    });
    inited = true;
  }
  return StellarWalletsKit;
}

/** True if the user connected before (so we should try to rehydrate). Avoids
 * touching the wallet kit at all for first-time visitors. */
export function wasConnected(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(CONNECTED_KEY) === "1";
}

export type Wallet = {
  id: string;
  name: string;
  isAvailable: boolean;
  icon: string;
  url: string;
};

/** The wallets we can offer, to render our own picker UI. */
export async function listWallets(): Promise<Wallet[]> {
  const list = await kit().refreshSupportedWallets();
  return list.map((w) => ({
    id: w.id,
    name: w.name,
    isAvailable: w.isAvailable,
    icon: w.icon,
    url: w.url,
  }));
}

/** Select a wallet by id and return its address (prompts the wallet).
 * fetchAddress() is the call that actually asks the wallet; getAddress() only
 * reads the cached value and throws before a connection exists. */
export async function selectWallet(id: string): Promise<string> {
  kit().setWallet(id);
  const { address } = await kit().fetchAddress();
  localStorage.setItem(CONNECTED_KEY, "1");
  localStorage.setItem(WALLET_ID_KEY, id);
  return address;
}

/** Re-establish the address on reload by re-selecting the stored wallet and
 * fetching (authorized wallets return silently, no popup). */
export async function currentAddress(): Promise<string | null> {
  const id = typeof window !== "undefined" ? localStorage.getItem(WALLET_ID_KEY) : null;
  if (!id) return null;
  try {
    kit().setWallet(id);
    const { address } = await kit().fetchAddress();
    return address || null;
  } catch {
    return null;
  }
}

export async function disconnect(): Promise<void> {
  localStorage.removeItem(CONNECTED_KEY);
  localStorage.removeItem(WALLET_ID_KEY);
  await kit().disconnect();
}

export async function openProfile(): Promise<void> {
  await kit().profileModal();
}

// Signs transactions with the connected wallet (Freighter, Lobstr, xBull, ...).
async function signTx(xdr: string) {
  return kit().signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
}

function clientOpts(address: string) {
  return {
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey: address,
    signTransaction: signTx,
  };
}

async function currentLedger(): Promise<number> {
  return (await new rpc.Server(RPC_URL).getLatestLedger()).sequence;
}

async function submitClassic(signedXdr: string): Promise<void> {
  const server = new rpc.Server(RPC_URL);
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") throw new Error("transaction rejected");
  for (let i = 0; i < 25; i++) {
    const g = await server.getTransaction(sent.hash);
    if (g.status === "SUCCESS") return;
    if (g.status === "FAILED") throw new Error("transaction failed");
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("transaction timed out");
}

/** Onboarding faucet: fund the account if new, establish a USDC trustline
 * (user signs), then mint test USDC from the issuer. */
export async function getTestUsdc(address: string): Promise<void> {
  const server = new rpc.Server(RPC_URL);
  try {
    await server.getAccount(address);
  } catch {
    await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Establish (or top up) the USDC trustline. The user signs this classic op.
  const acct = await server.getAccount(address);
  const tx = new TransactionBuilder(acct, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: new Asset(USDC_CODE, USDC_ISSUER) }))
    .setTimeout(120)
    .build();
  const { signedTxXdr } = await kit().signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  });
  await submitClassic(signedTxXdr);

  // Issuer mints test USDC to the now-trusting account (server side).
  const r = await fetch("/api/faucet", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!r.ok) throw new Error("faucet mint failed");
}

/** Deposit: approve the pool to pull USDC, then deposit. Both signed by the
 * connected wallet, which is also the fee payer. */
export async function deposit(
  address: string,
  amountStroops: string,
  lockUntil: bigint
): Promise<void> {
  const exp = (await currentLedger()) + 100_000;
  const usdc = new UsdcClient({ contractId: USDC_SAC, ...clientOpts(address) });
  const approveTx = await usdc.approve({
    from: address,
    spender: PRIZE_POOL_ID,
    amount: BigInt(amountStroops),
    expiration_ledger: exp,
  });
  await approveTx.signAndSend();

  const pool = new PoolClient({ contractId: PRIZE_POOL_ID, ...clientOpts(address) });
  const dep = await pool.deposit({
    from: address,
    amount: BigInt(amountStroops),
    lock_until: lockUntil,
  });
  await dep.signAndSend();
}

export async function withdraw(
  address: string,
  amountStroops: string,
  forceEarly: boolean
): Promise<void> {
  const pool = new PoolClient({ contractId: PRIZE_POOL_ID, ...clientOpts(address) });
  const tx = await pool.withdraw({
    to: address,
    amount: BigInt(amountStroops),
    force_early: forceEarly,
  });
  await tx.signAndSend();
}
