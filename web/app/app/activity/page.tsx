"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletProvider";
import Skeleton from "@/components/Skeleton";
import { formatUsdc } from "@/lib/format";
import type { ActivityRow } from "@/lib/server/activity-merge";

const EXPLORER_TX = "https://stellar.expert/explorer/testnet/tx/";

const META: Record<ActivityRow["kind"], { icon: string; label: string; accent: string; positive?: boolean }> = {
  deposit: { icon: "＋", label: "Deposited", accent: "var(--volt)" },
  withdraw: { icon: "↺", label: "Withdrew", accent: "var(--ink-60)" },
  earlyexit: { icon: "⚡", label: "Early exit", accent: "var(--coral)" },
  win: { icon: "🏆", label: "Won prize", accent: "var(--mint)", positive: true },
};

export default function ActivityPage() {
  const { address, connect, connecting } = useWallet();
  const [rows, setRows] = useState<ActivityRow[] | null>(null);

  const load = useCallback(async () => {
    if (!address) return;
    setRows(null);
    const r = await fetch(`/api/activity?user=${address}`, { cache: "no-store" });
    if (r.ok) {
      const { activity } = (await r.json()) as { activity: ActivityRow[] };
      setRows(activity);
    } else {
      setRows([]);
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  if (!address) {
    return (
      <main className="flex-1 max-w-md mx-auto w-full px-5 py-10">
        <div className="card p-6 text-center">
          <h1 className="font-bold text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Connect a wallet first
          </h1>
          <p className="text-ink-60 mb-5">Connect to see your on-chain activity.</p>
          <button onClick={connect} disabled={connecting} className="btn btn-primary px-6 py-3">
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-md mx-auto w-full px-5 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app" className="text-ink-60 text-2xl leading-none" aria-label="Back">
          ‹
        </Link>
        <h1 className="font-bold text-2xl" style={{ fontFamily: "var(--font-display)" }}>
          Your activity
        </h1>
      </div>

      {rows === null ? (
        <ul className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="card p-4">
              <Skeleton className="h-10 w-full" />
            </li>
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <div className="card p-6 text-center text-ink-60">
          No activity yet. Your deposits, withdrawals, and wins show up here —
          each links to the transaction on Stellar Expert.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const m = META[r.kind];
            return (
              <li key={r.txHash + r.kind}>
                <a
                  href={`${EXPLORER_TX}${r.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-hover p-4 flex items-center gap-4"
                >
                  <span
                    className="shrink-0 w-10 h-10 rounded-xl grid place-items-center text-lg font-bold"
                    style={{ color: m.accent, background: `color-mix(in srgb, ${m.accent} 14%, #fff)` }}
                  >
                    {m.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.label}</p>
                    <p className="text-ink-60 text-xs mt-0.5">
                      {r.kind === "win" && r.epoch != null ? `Draw #${r.epoch} · ` : ""}
                      {r.kind === "earlyexit" && r.penalty
                        ? `−$${formatUsdc(r.penalty, 4)} penalty · `
                        : ""}
                      {new Date(r.at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className="tabular font-bold shrink-0"
                    style={{ fontFamily: "var(--font-data)", color: m.positive ? "var(--mint)" : "var(--ink)" }}
                  >
                    {m.positive ? "+" : ""}${formatUsdc(r.amount, 4)}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-ink-60 text-xs text-center mt-6">
        Showing recent on-chain events. Tap any row to verify it on Stellar Expert.
      </p>
    </main>
  );
}
