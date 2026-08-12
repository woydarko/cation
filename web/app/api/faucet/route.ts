import { NextRequest, NextResponse } from "next/server";
import { Keypair, contract as contractNS } from "@stellar/stellar-sdk";
import { Client as UsdcClient } from "usdc-client";
import { RPC_URL, NETWORK_PASSPHRASE, USDC_SAC } from "@/lib/config";

export const dynamic = "force-dynamic";

const FAUCET_AMOUNT = 1_000_000_000n; // 100 USDC (7 decimals)

export async function POST(req: NextRequest) {
  const secret = process.env.CATION_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "faucet not configured" }, { status: 500 });
  }
  let address: string;
  try {
    ({ address } = await req.json());
    // Accept classic accounts (G…) and smart-wallet contracts (C…).
    if (!address || !/^[GC]/.test(address)) throw new Error("bad address");
  } catch {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }

  try {
    const admin = Keypair.fromSecret(secret);
    const sg = contractNS.basicNodeSigner(admin, NETWORK_PASSPHRASE);
    const usdc = new UsdcClient({
      contractId: USDC_SAC,
      networkPassphrase: NETWORK_PASSPHRASE,
      rpcUrl: RPC_URL,
      publicKey: admin.publicKey(),
      signTransaction: sg.signTransaction,
      signAuthEntry: sg.signAuthEntry,
    });
    const tx = await usdc.mint({ to: address, amount: FAUCET_AMOUNT });
    await tx.signAndSend();
    return NextResponse.json({ ok: true, minted: FAUCET_AMOUNT.toString() });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "mint failed" },
      { status: 502 }
    );
  }
}
