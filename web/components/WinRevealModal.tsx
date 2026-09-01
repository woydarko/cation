"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatUsdc } from "@/lib/format";

/**
 * The delight moment (PRD §5.2). A scratch-card the winner rubs to reveal the
 * prize, then confetti. Honors reduced-motion by revealing immediately.
 */
export default function WinRevealModal({
  amount,
  epoch,
  onClose,
}: {
  amount: string;
  epoch: number;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealed(true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Foil cover.
    ctx.fillStyle = "#6C4CF1";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "600 16px 'General Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scratch to reveal", w / 2, h / 2 + 5);

    let drawing = false;
    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    };
    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
    };
    // Reveal once ~60% is scratched, checked live (throttled) so the user
    // never has to clear the whole card.
    let lastCheck = 0;
    const maybeReveal = () => {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0;
      let total = 0;
      for (let i = 3; i < img.length; i += 40) {
        total++;
        if (img[i] === 0) clear++;
      }
      if (total > 0 && clear / total > 0.6) setRevealed(true);
    };
    const onDown = (e: PointerEvent) => {
      drawing = true;
      scratch(...pos(e));
    };
    const onMove = (e: PointerEvent) => {
      if (!drawing) return;
      scratch(...pos(e));
      const now = performance.now();
      if (now - lastCheck > 120) {
        lastCheck = now;
        maybeReveal();
      }
    };
    const onUp = () => {
      drawing = false;
      maybeReveal();
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-6">
      <div className="card w-full max-w-sm p-8 text-center relative overflow-hidden">
        {revealed && <Confetti />}
        <p className="text-ink-60 font-semibold uppercase tracking-wide text-sm mb-2">
          Draw #{epoch}
        </p>
        <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "var(--font-display)" }}>
          You won the pot. Nice.
        </h2>

        <div className="relative h-28 rounded-2xl overflow-hidden mb-6 bg-zap/20 flex items-center justify-center">
          <span
            className="tabular text-4xl font-bold text-ink"
            style={{ fontFamily: "var(--font-data)" }}
          >
            +${formatUsdc(amount, 7)}
          </span>
          {!revealed && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full cursor-grab touch-none"
            />
          )}
        </div>

        {revealed ? (
          <div className="flex flex-col gap-3">
            <button onClick={() => shareWin(amount)} className="btn btn-primary w-full py-3">
              Share my win
            </button>
            <button onClick={onClose} className="btn w-full py-3 border-2 border-ink-12 text-ink-60 font-semibold hover:border-volt hover:text-volt transition-colors">
              Collect
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="btn btn-primary w-full py-3">
            Skip
          </button>
        )}
      </div>
    </div>
  );
}

/** Let the winner brag. Uses the native share sheet where available (mobile),
 * falling back to an X compose window. Either way the user confirms the post
 * themselves — nothing is sent automatically. */
async function shareWin(amount: string) {
  const url =
    typeof window !== "undefined" ? window.location.origin : "https://cation-henna.vercel.app";
  const text = `I just won $${formatUsdc(amount, 7)} in the Cation daily no-loss prize draw 🎉 My savings never left my wallet. Save & win:`;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "I won on Cation", text, url });
      return;
    } catch {
      // user dismissed the sheet, or share unavailable — fall through
    }
  }
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${url}`)}`;
  window.open(intent, "_blank", "noopener,noreferrer");
}

function Confetti() {
  const colors = ["#C7F94B", "#6C4CF1", "#FF7A5C", "#2FD9A8"];
  // Randomize once so re-renders don't reshuffle the pieces mid-fall.
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: Math.random() * 100,
        color: colors[i % colors.length],
        dur: 1.5 + Math.random() * 1.5,
        delay: Math.random(),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-10%",
            width: 8,
            height: 8,
            background: p.color,
            borderRadius: 2,
            animation: `fall ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style>{`@keyframes fall { to { transform: translateY(360px) rotate(${360}deg); opacity: 0; } }`}</style>
    </div>
  );
}
