"use client";
import { useState } from "react";
import { AmountInput } from "./Sheet";
import { useWallet } from "./WalletProvider";
import { useToast } from "./Toast";
import { toStroops, toUsdc, formatUsdc } from "@/lib/format";
import { track } from "@/lib/analytics";

const LEDGERS_PER_DAY = 17280;
const LOCK_PRESETS = [7, 30, 90];
const PCTS = [25, 50, 75, 100];

export default function DepositForm({
  usdcBalance,
  currentLedger,
  onDone,
}: {
  usdcBalance: string;
  currentLedger: number;
  onDone: () => void;
}) {
  const { deposit } = useWallet();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [lock, setLock] = useState(false);
  const [lockDays, setLockDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const max = toUsdc(usdcBalance);
  const n = Number(amount) || 0;
  const tickets = Math.round(n);
  const overBalance = n > max;

  const setPct = (pct: number) => {
    const v = (max * pct) / 100;
    setAmount(v === 0 ? "" : String(Number(v.toFixed(7))));
  };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      const lockUntil = lock ? BigInt(currentLedger + lockDays * LEDGERS_PER_DAY) : 0n;
      await deposit(toStroops(n), lockUntil);
      track("deposit", { amount: n, locked: lock });
      toast("success", `Added $${n}. You're in the draw.`);
      setAmount("");
      onDone();
    } catch (e) {
      setError("That deposit did not go through. Your money is safe. Try again.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AmountInput value={amount} onChange={setAmount} />

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-ink-60">
          You have <span className="tabular font-semibold text-ink">${formatUsdc(usdcBalance)}</span> USDC
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PCTS.map((p) => (
          <button
            key={p}
            onClick={() => setPct(p)}
            disabled={max <= 0}
            className="rounded-xl border-2 border-ink-12 py-2 text-sm font-semibold text-ink-60 hover:border-volt hover:text-volt disabled:opacity-40 transition-colors"
          >
            {p === 100 ? "MAX" : `${p}%`}
          </button>
        ))}
      </div>

      <button
        onClick={() => setLock((v) => !v)}
        className={`w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3 mb-3 transition-colors ${
          lock ? "border-volt bg-volt-12" : "border-ink-12"
        }`}
      >
        <span className="font-medium">Lock it till I mean it</span>
        <span className={`w-11 h-6 rounded-full relative transition-colors ${lock ? "bg-volt" : "bg-ink-12"}`}>
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${lock ? "left-[22px]" : "left-0.5"}`}
          />
        </span>
      </button>

      {lock && (
        <div className="flex gap-2 mb-4">
          {LOCK_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setLockDays(d)}
              className={`flex-1 rounded-xl border-2 py-2 text-sm font-semibold ${
                lockDays === d ? "border-volt text-volt" : "border-ink-12 text-ink-60"
              }`}
            >
              {d} days
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-coral text-sm mb-3">{error}</p>}
      {overBalance && (
        <p className="text-coral text-sm mb-3">
          That is more than your ${formatUsdc(usdcBalance)} USDC.{" "}
          <a
            href="https://faucet.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-volt"
          >
            Get test USDC
          </a>{" "}
          first.
        </p>
      )}

      <button
        onClick={submit}
        disabled={busy || n <= 0 || overBalance}
        className="btn btn-primary w-full py-4 text-base disabled:opacity-40"
      >
        {busy ? "Adding…" : n > 0 ? `Add $${n} and get ${tickets} tickets` : "Enter an amount"}
      </button>
      {lock && (
        <p className="text-center text-ink-60 text-sm mt-3">
          Locked for {lockDays} days. Early exit costs a 5% penalty that goes to the pot.
        </p>
      )}
    </div>
  );
}
