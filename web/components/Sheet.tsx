"use client";
import { useEffect } from "react";

/** Bottom sheet modal. */
export default function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full sm:max-w-md rounded-b-none sm:rounded-b-[var(--radius-card)] p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h2>
          <button onClick={onClose} className="text-ink-60 text-2xl leading-none px-2" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AmountInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-2 border-ink-12 rounded-2xl px-4 py-4 mb-4 focus-within:border-volt">
      <span className="tabular text-2xl font-bold text-ink-60">$</span>
      <input
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        className="tabular text-2xl font-bold bg-transparent outline-none w-full text-ink"
        style={{ fontFamily: "var(--font-data)" }}
      />
      <span className="text-ink-60 font-medium">USDC</span>
    </div>
  );
}
