/** One consistent card used across the landing sections. Left-aligned, big
 * typographic index, accent bar on top. Equal height via h-full (grid parent
 * stretches). */
export default function InfoCard({
  badge,
  accent,
  title,
  body,
}: {
  badge: React.ReactNode;
  accent: string;
  title: string;
  body: string;
}) {
  return (
    <div
      className="card card-hover card-accent p-6 h-full flex flex-col text-left"
      style={{ ["--accent" as string]: accent }}
    >
      <div className="flex items-baseline gap-3 mb-4">
        <span
          className="card-index text-4xl font-extrabold leading-none tabular"
          style={{ fontFamily: "var(--font-display)", color: accent }}
        >
          {badge}
        </span>
        <span className="h-px flex-1 mt-1" style={{ background: "var(--ink-12)" }} />
      </div>
      <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      <p className="text-ink-60 leading-relaxed">{body}</p>
    </div>
  );
}
