"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import PotCounter from "@/components/PotCounter";
import Countdown from "@/components/Countdown";
import WinRevealModal from "@/components/WinRevealModal";
import Skeleton from "@/components/Skeleton";
import { useWallet } from "@/components/WalletProvider";
import { useToast } from "@/components/Toast";
import { formatUsdc, secondsToNextUtcMidnight, oddsPct } from "@/lib/format";
import type { PoolState } from "@/lib/server/contract";

type Draw = { winner: string; amount: string; epoch: number };

export default function Dashboard() {
  const { address, connect, connecting, getTestUsdc } = useWallet();
  const toast = useToast();
  const [state, setState] = useState<PoolState | null>(null);
  const [draws, setDraws] = useState<Draw[]>([]);
  const [win, setWin] = useState<{ amount: string; epoch: number } | null>(null);
  const [fauceting, setFauceting] = useState(false);

  const checkDraws = useCallback(async () => {
    const r = await fetch("/api/history", { cache: "no-store" });
    if (!r.ok) return;
    const { draws } = (await r.json()) as { draws: Draw[] };
    setDraws(draws);
    if (!address) return;
    const mine = draws.filter((d) => d.winner === address);
    if (mine.length) {
      const seen = Number(localStorage.getItem("cation.seenWinEpoch") ?? "-1");
      if (mine[0].epoch > seen) setWin({ amount: mine[0].amount, epoch: mine[0].epoch });
    }
  }, [address]);

  const refresh = useCallback(async () => {
    if (!address) return;
    const r = await fetch(`/api/state?user=${address}`, { cache: "no-store" });
    if (r.ok) setState(await r.json());
    checkDraws();
  }, [address, checkDraws]);

  useEffect(() => {
    if (!address) return;
    refresh();
    const id = setInterval(refresh, 12000);
    return () => clearInterval(id);
  }, [address, refresh]);

  const claim = async () => {
    setFauceting(true);
    try {
      await getTestUsdc();
      toast("success", "Trustline ready. Now claim at Circle faucet.");
      window.open("https://faucet.circle.com/", "_blank", "noopener,noreferrer");
      refresh();
    } catch (e) {
      toast("error", "Could not create trustline. Try again.");
      console.error(e);
    } finally {
      setFauceting(false);
    }
  };

  // Gate: the dashboard requires a connected wallet.
  if (!address) {
    return (
      <main className="flex-1 grid place-items-center px-6 py-24">
        <div className="card p-8 sm:p-10 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Connect your wallet
          </h1>
          <p className="text-ink-60 mb-6">
            Connect a Stellar wallet to view your dashboard, deposit, and join the
            daily draw. Freighter, Lobstr, xBull, and more.
          </p>
          <button onClick={connect} disabled={connecting} className="btn btn-primary px-8 py-4 text-lg">
            {connecting ? "Connecting…" : "Connect wallet"}
          </button>
        </div>
      </main>
    );
  }

  const secs = secondsToNextUtcMidnight(state?.serverTime);
  const bal = state?.user?.balance ?? "0";
  const usdc = state?.user?.usdcBalance ?? "0";
  const odds = state?.user ? oddsPct(state.user.tickets, state.totalTickets) : "0";
  const hasDeposit = BigInt(bal) > 0n;
  const wins = draws.filter((d) => d.winner === address).length;

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
        Dashboard
      </h1>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Pot (its own card, no countdown) */}
        <div className="card p-8 lg:col-span-2 flex flex-col justify-center min-h-[220px]">
          <p className="text-ink-60 text-xs font-semibold uppercase tracking-wide mb-4">
            Prize pot · epoch {state?.epoch ?? "…"}
          </p>
          {state ? (
            <PotCounter potStroops={state.pot} size="hero" align="left" />
          ) : (
            <Skeleton className="h-16 w-64" />
          )}
        </div>

        {/* Next draw (separate card) */}
        <div className="card p-6 lg:col-span-1 flex flex-col items-center justify-center text-center min-h-[220px]">
          <p className="text-ink-60 text-xs font-semibold uppercase tracking-wide mb-3">
            Next draw
          </p>
          {state ? (
            <p className="tabular text-3xl font-bold text-ink" style={{ fontFamily: "var(--font-data)" }}>
              <CountdownBig initialSeconds={secs} />
            </p>
          ) : (
            <Skeleton className="h-9 w-28" />
          )}
          <p className="text-ink-60 text-sm mt-2">Daily at 00:00 UTC</p>
        </div>

        {/* Stat tiles */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile label="Your balance" value={`$${formatUsdc(bal)}`} loading={!state} />
          <StatTile label="Wallet USDC" value={`$${formatUsdc(usdc)}`} loading={!state} />
          <StatTile label="Your odds" value={hasDeposit ? `${odds}%` : "0%"} accent loading={!state} />
          <StatTile label="Times won" value={String(wins)} loading={!state} />
        </div>

        {/* Actions */}
        <div className="card p-5 lg:col-span-3 flex flex-col sm:flex-row gap-3">
          <Link href="/app/manage?tab=deposit" className="btn btn-primary py-3.5 text-base text-center flex-1">
            Deposit
          </Link>
          <Link
            href="/app/manage?tab=withdraw"
            className={`btn py-3.5 text-base text-center flex-1 border-2 border-ink-12 text-ink ${
              hasDeposit ? "" : "opacity-40 pointer-events-none"
            }`}
          >
            Withdraw
          </Link>
          <button
            onClick={claim}
            disabled={fauceting}
            className="btn py-3.5 text-base flex-1 border-2 border-ink-12 text-ink-60 disabled:opacity-50"
          >
            {fauceting ? "Preparing…" : "Get test USDC"}
          </button>
        </div>

        {/* Recent draws */}
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Recent draws
            </h2>
            <Link href="/app/history" className="text-volt font-semibold text-sm hover:underline">
              View all
            </Link>
          </div>
          {draws.length === 0 ? (
            <p className="text-ink-60">No draws yet. The first winner shows up here soon.</p>
          ) : (
            <ul className="divide-y-2 divide-ink-12">
              {draws.slice(0, 4).map((d) => {
                const mine = d.winner === address;
                return (
                  <li key={d.epoch} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">Draw #{d.epoch}</span>
                      {mine && (
                        <span className="text-xs font-semibold rounded-full bg-zap/25 text-ink px-2 py-0.5">
                          You won
                        </span>
                      )}
                      <span className="tabular text-ink-60 text-sm">
                        {d.winner.slice(0, 4)}…{d.winner.slice(-4)}
                      </span>
                    </div>
                    <span className="tabular font-bold text-volt" style={{ fontFamily: "var(--font-data)" }}>
                      ${formatUsdc(d.amount, 7)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {win && (
        <WinRevealModal
          amount={win.amount}
          epoch={win.epoch}
          onClose={() => {
            localStorage.setItem("cation.seenWinEpoch", String(win.epoch));
            setWin(null);
          }}
        />
      )}
    </main>
  );
}

function CountdownBig({ initialSeconds }: { initialSeconds: number }) {
  return <Countdown initialSeconds={initialSeconds} label="" bare />;
}

function StatTile({
  label,
  value,
  accent,
  loading,
}: {
  label: string;
  value: string;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-ink-60 text-sm mb-2">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p
          className={`tabular text-2xl sm:text-3xl font-bold ${accent ? "text-volt" : "text-ink"}`}
          style={{ fontFamily: "var(--font-data)" }}
        >
          {value}
        </p>
      )}
    </div>
  );
}
