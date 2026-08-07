"use client";
import { useEffect, useRef, useState } from "react";
import { toUsdc } from "@/lib/format";

/**
 * The Pot - the one bold element (PRD §6.1). A large live-counting prize
 * number that ticks up as yield accrues, with a small plus-spark charge motif.
 */
export default function PotCounter({
  potStroops,
  size = "hero",
  align = "center",
}: {
  potStroops: string;
  size?: "hero" | "app";
  align?: "center" | "left";
}) {
  const target = toUsdc(potStroops);
  const [shown, setShown] = useState(target);
  const raf = useRef<number | null>(null);

  // Ease toward the latest target whenever it changes.
  useEffect(() => {
    const start = shown;
    const delta = target - start;
    if (Math.abs(delta) < 1e-9) return;
    const t0 = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(start + delta * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Testnet yields are tiny; show more decimals when small so the pot reads
  // as a live, non-zero number instead of $0.0000.
  const frac = shown >= 1 ? 4 : 7;
  const digits = shown.toLocaleString("en-US", {
    minimumFractionDigits: frac,
    maximumFractionDigits: frac,
  });

  const cls =
    size === "hero"
      ? "text-6xl sm:text-7xl md:text-8xl"
      : "text-5xl sm:text-6xl";

  return (
    <div className={`flex items-start gap-2 ${align === "left" ? "justify-start" : "justify-center"}`}>
      <span className="tabular font-bold text-volt mt-2 text-2xl sm:text-3xl">
        $
      </span>
      <span
        className={`tabular font-bold leading-none tracking-tight text-ink ${cls}`}
        style={{ fontFamily: "var(--font-data)" }}
      >
        {digits}
      </span>
      <span
        className="spark text-zap text-3xl sm:text-4xl -ml-1 mt-1 select-none"
        aria-hidden
        style={{ textShadow: "0 0 12px color-mix(in srgb, var(--zap) 60%, transparent)" }}
      >
        +
      </span>
    </div>
  );
}
