"use client";
import { useState } from "react";
import { AmountInput } from "./Sheet";
import { useWallet } from "./WalletProvider";
import { useToast } from "./Toast";
import { formatUsdc, toStroops, toUsdc } from "@/lib/format";

const PCTS = [25, 50, 75, 100];
const PENALTY_PCT = 5; // early-exit penalty, routed to the prize pot

export default function WithdrawForm({
  balance,
  onDone,
}: {
  balance: string;
  onDone: () => void;
}) {
  const { withdraw } = useWallet();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const max = toUsdc(balance);
  const n = Number(amount) || 0;
  const penaltyAmt = n * (PENALTY_PCT / 100);
  const netAfterPenalty = n - penaltyAmt;

  const setPct = (pct: number) => {
    const v = (max * pct) / 100;
    setAmount(v === 0 ? "" : String(Number(v.toFixed(7))));
  };

  const submit = async (forceEarly: boolean) => {
    setError(null);
    setLocked(false);
    setBusy(true);
    try {
      await withdraw(toStroops(n), forceEarly);
      toast(
        "success",
        forceEarly
          ? `Withdrew $${n}. You received $${formatUsdc(toStroops(netAfterPenalty), 4)} after the ${PENALTY_PCT}% penalty.`
          : `Withdrew $${n}.`
      );
      setAmount("");
      onDone();
    } catch (e) {
      const msg = String(e);
      if (msg.includes("#6") || msg.toLowerCase().includes("lock")) {
        setLocked(true);
      } else {
        setError("That withdrawal did not go through. Try again.");
      }
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (max <= 0) {
    return (
      <p className="text-ink-60 text-center py-6">
        Nothing to withdraw yet. Add USDC in the Deposit tab first.
      </p>
    );
  }

  return (
    <div>
      <AmountInput value={amount} onChange={setAmount} />

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-ink-60">
          Deposited <span className="tabular font-semibold text-ink">${formatUsdc(balance)}</span>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PCTS.map((p) => (
          <button
            key={p}
            onClick={() => setPct(p)}
            className="rounded-xl border-2 border-ink-12 py-2 text-sm font-semibold text-ink-60 hover:border-volt hover:text-volt transition-colors"
          >
            {p === 100 ? "MAX" : `${p}%`}
          </button>
        ))}
      </div>

      {error && <p className="text-coral text-sm mb-3">{error}</p>}

      {locked ? (
        <div className="rounded-2xl bg-volt-12 p-4">
          <p className="text-sm mb-3">
            Part of this is locked. You can still exit early. The {PENALTY_PCT}% penalty goes
            into the prize pot.
          </p>
          {n > 0 && (
            <div className="text-sm mb-3 rounded-xl bg-white/60 p-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-60">You withdraw</span>
                <span className="tabular">${formatUsdc(toStroops(n), 4)}</span>
              </div>
              <div className="flex justify-between text-coral">
                <span>Early-exit penalty ({PENALTY_PCT}%)</span>
                <span className="tabular">−${formatUsdc(toStroops(penaltyAmt), 4)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-ink-12 pt-1 mt-1">
                <span>You receive</span>
                <span className="tabular">${formatUsdc(toStroops(netAfterPenalty), 4)}</span>
              </div>
            </div>
          )}
          <button
            onClick={() => submit(true)}
            disabled={busy || n <= 0}
            className="btn w-full py-3 border-2 border-volt text-volt font-semibold disabled:opacity-40"
          >
            {busy
              ? "Withdrawing…"
              : n > 0
                ? `Exit early and get $${formatUsdc(toStroops(netAfterPenalty), 4)}`
                : "Enter an amount"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => submit(false)}
          disabled={busy || n <= 0 || n > max}
          className="btn btn-primary w-full py-4 text-base disabled:opacity-40"
        >
          {busy ? "Withdrawing…" : n > 0 ? `Withdraw $${n}` : "Enter an amount"}
        </button>
      )}
    </div>
  );
}
