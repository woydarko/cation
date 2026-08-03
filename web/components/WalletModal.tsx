"use client";
import { useEffect } from "react";
import type { Wallet } from "@/lib/client/wallet";

/** Our own wallet picker, styled with the Cation design system, instead of the
 * kit's default modal. Lists the supported wallets; available ones connect,
 * missing ones link to install. */
export default function WalletModal({
  wallets,
  connectingId,
  error,
  onSelect,
  onClose,
}: {
  wallets: Wallet[];
  connectingId: string | null;
  error?: string | null;
  onSelect: (w: Wallet) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="card w-full sm:max-w-sm rounded-b-none sm:rounded-b-[var(--radius-card)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Connect wallet
          </h2>
          <button onClick={onClose} className="text-ink-60 text-2xl leading-none px-2" aria-label="Close">
            ×
          </button>
        </div>
        <p className="text-ink-60 text-sm mb-5">Pick a Stellar wallet to continue.</p>

        {error && (
          <p className="text-coral text-sm mb-4 rounded-xl bg-coral/10 px-3 py-2">{error}</p>
        )}

        <ul className="flex flex-col gap-2">
          {wallets.length === 0 && (
            <li className="text-ink-60 text-sm py-4 text-center">Loading wallets…</li>
          )}
          {wallets.map((w) => {
            const busy = connectingId === w.id;
            return (
              <li key={w.id}>
                <button
                  onClick={() => onSelect(w)}
                  disabled={!!connectingId}
                  className="w-full flex items-center gap-3 rounded-2xl border-2 border-ink-12 px-4 py-3 hover:border-volt transition-colors disabled:opacity-60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={w.icon} alt="" className="w-8 h-8 rounded-lg shrink-0" />
                  <span className="font-semibold text-ink flex-1 text-left">{w.name}</span>
                  {busy ? (
                    <span className="text-ink-60 text-sm">Connecting…</span>
                  ) : w.isAvailable ? (
                    <span className="text-volt text-sm font-semibold">Connect</span>
                  ) : (
                    <span className="text-ink-60 text-xs rounded-full border-2 border-ink-12 px-2 py-0.5">
                      Install
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-center text-ink-60 text-xs mt-5">
          New to Stellar? Freighter and Lobstr are good places to start.
        </p>
      </div>
    </div>
  );
}
