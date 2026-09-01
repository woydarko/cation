"use client";
import DepositForm from "./DepositForm";
import { formatUsdc } from "@/lib/format";

/**
 * First-run onboarding. Shown on the dashboard until the user has a deposit.
 * Collapses three scattered actions (trustline, faucet, deposit) into one
 * focused flow that always surfaces the single next step. Reuses DepositForm
 * for the final step so there is one deposit code path, not two.
 */
export default function OnboardWizard({
  usdcBalance,
  currentLedger,
  onGetUsdc,
  busy,
  onDone,
}: {
  usdcBalance: string;
  currentLedger: number;
  onGetUsdc: () => void;
  busy: boolean;
  onDone: () => void;
}) {
  const hasUsdc = BigInt(usdcBalance || "0") > 0n;
  const step = hasUsdc ? 3 : 2; // 1 connect (done) · 2 get USDC · 3 deposit

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>
          Get into today&apos;s draw
        </h2>
        <span className="text-ink-60 text-sm font-semibold tabular">Step {step} of 3</span>
      </div>
      <Dots step={step} />

      {!hasUsdc ? (
        <div className="mt-5">
          <p className="text-ink-60 mb-5">
            You&apos;re connected. Next, grab some testnet USDC — we&apos;ll set up
            the trustline and open the Circle faucet for you.
          </p>
          <button
            onClick={onGetUsdc}
            disabled={busy}
            className="btn btn-primary w-full py-4 text-base disabled:opacity-60"
          >
            {busy ? "Preparing…" : "Set up trustline & get test USDC"}
          </button>
          <button
            onClick={onDone}
            className="btn w-full py-3 mt-3 border-2 border-ink-12 text-ink-60 font-semibold hover:border-volt hover:text-volt transition-colors"
          >
            Already have USDC? Refresh
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-ink-60 mb-5">
            You&apos;ve got{" "}
            <span className="tabular font-semibold text-ink">${formatUsdc(usdcBalance)}</span>{" "}
            USDC. Deposit to get tickets and join the daily draw — your principal
            never leaves your control.
          </p>
          <DepositForm usdcBalance={usdcBalance} currentLedger={currentLedger} onDone={onDone} />
        </div>
      )}
    </div>
  );
}

function Dots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mt-3" aria-hidden>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-1.5 rounded-full transition-all ${
            n <= step ? "bg-volt flex-[2]" : "bg-ink-12 flex-1"
          }`}
        />
      ))}
    </div>
  );
}
