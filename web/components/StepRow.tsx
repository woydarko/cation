"use client";
import Reveal from "./Reveal";
import CardDecor from "./CardDecor";

/** Feature card in the reference's style, adapted to the light theme: coloured
 * icon top-left, a small tag top-right, a label + big title, a short line of
 * copy, and an accent decorative graphic in the corner. Pops in on scroll. */
export default function StepRow({
  icon,
  accent,
  label,
  title,
  body,
  tag,
  decor,
  delay = 0,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  title: string;
  body: string;
  tag: string;
  decor: "waves" | "dots" | "chevron" | "dashes";
  delay?: number;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <div
        className="card card-hover relative overflow-hidden p-6 h-full min-h-[290px] flex flex-col"
        style={{ ["--accent" as string]: accent }}
      >
        <div className="flex items-start justify-between relative z-10">
          <div
            className="w-12 h-12 rounded-xl grid place-items-center text-white text-xl shrink-0"
            style={{ background: accent }}
          >
            {icon}
          </div>
          <span className="text-xs font-semibold text-ink-60 tracking-wide">{tag}</span>
        </div>

        <div className="relative z-10 mt-auto pt-10">
          <p className="text-sm text-ink-60 mb-1">{label}</p>
          <h3 className="text-2xl leading-tight font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h3>
          <p className="text-ink-60 text-sm max-w-[80%] leading-relaxed">{body}</p>
        </div>

        <CardDecor variant={decor} accent={accent} />
      </div>
    </Reveal>
  );
}
