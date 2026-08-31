"use client";
import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

/**
 * Counts down to the next draw. Seeded from the on-chain ledger gap so it is
 * accurate on load, then ticks locally each second.
 */
export default function Countdown({
  initialSeconds,
  label = "Next draw in",
  bare = false,
}: {
  initialSeconds: number;
  label?: string;
  bare?: boolean;
}) {
  const [secs, setSecs] = useState(initialSeconds);

  useEffect(() => setSecs(initialSeconds), [initialSeconds]);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const text = secs > 0 ? formatCountdown(secs) : "drawing…";
  // Last hour before the draw: pulse in coral to signal urgency.
  const urgent = secs > 0 && secs < 3600;

  // Bare: just the value, so a parent can style it (e.g. the Next draw card).
  if (bare) return <span className={urgent ? "countdown-urgent" : ""}>{text}</span>;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-ink-60 text-sm font-medium">{label}</span>
      <span
        className={`tabular text-xl font-bold ${urgent ? "countdown-urgent" : "text-ink"}`}
        style={{ fontFamily: "var(--font-data)" }}
      >
        {text}
      </span>
    </div>
  );
}
