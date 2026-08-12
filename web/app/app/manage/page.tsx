"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DepositForm from "@/components/DepositForm";
import WithdrawForm from "@/components/WithdrawForm";
import { useWallet } from "@/components/WalletProvider";
import type { PoolState } from "@/lib/server/contract";

function Manage() {
  const { address, connect, connecting } = useWallet();
  const params = useSearchParams();
  const [tab, setTab] = useState<"deposit" | "withdraw">(
    params.get("tab") === "withdraw" ? "withdraw" : "deposit"
  );
  const [state, setState] = useState<PoolState | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    const r = await fetch(`/api/state?user=${address}`, { cache: "no-store" });
    if (r.ok) setState(await r.json());
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!address) {
    return (
      <main className="flex-1 max-w-md mx-auto w-full px-5 py-10">
        <div className="card p-6 text-center">
          <h1 className="font-bold text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Connect a wallet first
          </h1>
          <p className="text-ink-60 mb-5">Connect to deposit or withdraw.</p>
          <button onClick={connect} disabled={connecting} className="btn btn-primary px-6 py-3">
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        </div>
      </main>
    );
  }

  const usdc = state?.user?.usdcBalance ?? "0";
  const bal = state?.user?.balance ?? "0";
  const currentLedger = state?.currentLedger ?? 0;

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app" className="text-ink-60 text-2xl leading-none" aria-label="Back to dashboard">
          ‹
        </Link>
        <h1 className="font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Manage funds
        </h1>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 rounded-2xl border-2 border-ink-12 p-1 mb-6">
        {(["deposit", "withdraw"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2.5 rounded-xl font-semibold capitalize transition-colors ${
              tab === t ? "bg-volt text-white" : "text-ink-60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="card p-6">
        {tab === "deposit" ? (
          <DepositForm usdcBalance={usdc} currentLedger={currentLedger} onDone={refresh} />
        ) : (
          <WithdrawForm balance={bal} onDone={refresh} />
        )}
      </div>
    </main>
  );
}

export default function ManagePage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Manage />
    </Suspense>
  );
}
