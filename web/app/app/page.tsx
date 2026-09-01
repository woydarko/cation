"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import PotCounter from "@/components/PotCounter";
import Countdown from "@/components/Countdown";
import WinRevealModal from "@/components/WinRevealModal";
import OnboardWizard from "@/components/OnboardWizard";
import Skeleton from "@/components/Skeleton";
import { useWallet } from "@/components/WalletProvider";
import { useToast } from "@/components/Toast";
import { formatUsdc, secondsToNextUtcMidnight, oddsPct } from "@/lib/format";
import { FEEDBACK_URL } from "@/lib/config";
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
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ===== Main column ===== */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Welcome */}
          <div className="card p-6 sm:p-8 flex items-center gap-5">
            <div className="hidden sm:grid shrink-0 w-16 h-16 rounded-2xl place-items-center text-3xl bg-volt-12">
              👋
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Welcome back
              </h1>
              <p className="text-ink-60 mt-1">
                {hasDeposit
                  ? "You're in today's draw. Good luck at 00:00 UTC."
                  : "Deposit USDC to get tickets and join today's draw."}
              </p>
            </div>
          </div>

          {/* Prize pot hero */}
          <div className="card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-ink-60 text-xs font-semibold uppercase tracking-wide">
                Prize pot · epoch {state?.epoch ?? "…"}
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-cloud px-3 py-1 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-mint animate-pulse" aria-hidden />
                {state ? <Countdown initialSeconds={secs} label="" bare /> : "…"}
              </span>
            </div>
            {state ? (
              <PotCounter potStroops={state.pot} size="app" align="left" />
            ) : (
              <Skeleton className="h-14 w-64" />
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/manage?tab=deposit" className="btn btn-primary px-6 py-3 text-base">
                Deposit USDC
              </Link>
              <Link
                href="/app/manage?tab=withdraw"
                className={`btn px-6 py-3 text-base border-2 border-ink-12 text-ink ${
                  hasDeposit ? "hover:border-volt" : "opacity-40 pointer-events-none"
                }`}
              >
                Withdraw
              </Link>
            </div>
          </div>

          {/* Onboarding — active until the first deposit lands */}
          {!hasDeposit && (
            <OnboardWizard
              usdcBalance={usdc}
              currentLedger={state?.currentLedger ?? 0}
              onGetUsdc={claim}
              busy={fauceting}
              onDone={refresh}
            />
          )}

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ActionTile
              icon="＋"
              accent="var(--volt)"
              title="Deposit"
              desc="Add USDC and get tickets for the draw."
              href="/app/manage?tab=deposit"
            />
            <ActionTile
              icon="↺"
              accent="var(--mint)"
              title="Withdraw"
              desc="Take your principal out anytime."
              href={hasDeposit ? "/app/manage?tab=withdraw" : undefined}
            />
            <ActionTile
              icon="🪙"
              accent="var(--coral)"
              title={fauceting ? "Preparing…" : "Get test USDC"}
              desc="Set up a trustline and claim from the faucet."
              onClick={claim}
              disabled={fauceting}
            />
            <ActionTile
              icon="🏆"
              accent="var(--volt)"
              title="Draw history"
              desc="See every past winner and payout on-chain."
              href="/app/history"
            />
            <ActionTile
              icon="📜"
              accent="var(--mint)"
              title="Your activity"
              desc="Your deposits, withdrawals, and wins — each verifiable on-chain."
              href="/app/activity"
            />
          </div>

          {/* Recent draws */}
          <div className="card p-6">
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
                          <span className="text-xs font-semibold rounded-full bg-mint/25 text-ink px-2 py-0.5">
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

        {/* ===== Right column ===== */}
        <div className="flex flex-col gap-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatTile wide label="Your balance" value={`$${formatUsdc(bal)}`} loading={!state} />
            <StatTile wide label="Wallet USDC" value={`$${formatUsdc(usdc)}`} loading={!state} />
            <StatTile label="Your odds" value={hasDeposit ? `${odds}%` : "0%"} accent loading={!state} />
            <StatTile label="Times won" value={String(wins)} loading={!state} />
          </div>

          {/* Help card (violet) */}
          <div className="rounded-[var(--radius-card)] p-6 text-white relative overflow-hidden"
               style={{ background: "linear-gradient(135deg, #8163ff 0%, #6c4cf1 55%, #4a2fd0 100%)" }}>
            <div className="w-11 h-11 rounded-xl bg-white/15 grid place-items-center text-xl mb-4">?</div>
            <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>
              Tried it? Tell us.
            </h3>
            <p className="text-white/85 text-sm mb-5">
              Found something broken or confusing? Two minutes of feedback enters a
              monthly $USDG raffle.
            </p>
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn inline-flex bg-white text-volt px-5 py-2.5 text-sm font-semibold"
            >
              Give feedback →
            </a>
          </div>

          {/* How draws work */}
          <div className="card p-6">
            <h3 className="font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              How the draw works
            </h3>
            <ul className="text-ink-60 text-sm space-y-2">
              <li className="flex gap-2"><span className="text-volt font-bold">·</span> Every deposit earns tickets.</li>
              <li className="flex gap-2"><span className="text-volt font-bold">·</span> All the pooled interest becomes one prize.</li>
              <li className="flex gap-2"><span className="text-volt font-bold">·</span> One winner is drawn daily at 00:00 UTC.</li>
              <li className="flex gap-2"><span className="text-volt font-bold">·</span> Your principal never moves — withdraw anytime.</li>
            </ul>
            <Link href="/how-it-works" className="text-volt font-semibold text-sm hover:underline inline-block mt-4">
              Learn more →
            </Link>
          </div>
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

/* ---------- pieces ---------- */

function ActionTile({
  icon,
  accent,
  title,
  desc,
  href,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  accent: string;
  title: string;
  desc: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <div
        className="card-index shrink-0 w-11 h-11 rounded-xl grid place-items-center text-lg font-bold"
        style={{
          color: accent,
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, #fff), color-mix(in srgb, ${accent} 8%, #fff))`,
        }}
      >
        {icon}
      </div>
      <div className="text-left">
        <p className="font-bold" style={{ fontFamily: "var(--font-display)" }}>{title}</p>
        <p className="text-ink-60 text-sm mt-0.5">{desc}</p>
      </div>
    </>
  );
  const cls = "card card-hover p-5 flex items-start gap-4 w-full text-left";
  if (href) return <Link href={href} className={cls} style={{ ["--accent" as string]: accent }}>{inner}</Link>;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${cls} disabled:opacity-60`}
      style={{ ["--accent" as string]: accent }}
    >
      {inner}
    </button>
  );
}

/** Small stat card with an animated count-up value. */
function StatTile({
  label,
  value,
  accent,
  loading,
  wide,
}: {
  label: string;
  value: string;
  accent?: boolean;
  loading?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`card card-hover p-5 min-w-0 ${wide ? "col-span-2" : ""}`}>
      <p className="text-ink-60 text-sm mb-2 truncate">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p
          title={value}
          className={`tabular text-xl sm:text-2xl font-bold leading-tight truncate ${accent ? "text-volt" : "text-ink"}`}
          style={{ fontFamily: "var(--font-data)" }}
        >
          <CountUp value={value} />
        </p>
      )}
    </div>
  );
}

/** Animate a numeric value up from its previous value, keeping any prefix ($)
 * and suffix (%) and the target's decimal places. */
function CountUp({ value }: { value: string }) {
  const m = value.match(/^(\D*)(-?[\d,]*\.?\d+)(\D*)$/);
  const target = m ? parseFloat(m[2].replace(/,/g, "")) : NaN;
  const [n, setN] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      setN(target);
      return;
    }
    let raf = 0;
    const dur = 700;
    const a = from.current;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(a + (target - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  if (!m || Number.isNaN(target)) return <>{value}</>;
  const decimals = m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const num = n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <>
      {m[1]}
      {num}
      {m[3]}
    </>
  );
}
