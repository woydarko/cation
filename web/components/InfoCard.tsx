/** One consistent card used across the landing sections. Equal height via
 * h-full (grid parent stretches), centered content, uniform badge. */
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
    <div className="card card-hover p-6 h-full flex flex-col items-center text-center">
      <div
        className="w-12 h-12 rounded-2xl grid place-items-center font-bold text-ink mb-4 tabular text-lg"
        style={{ background: accent }}
      >
        {badge}
      </div>
      <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      <p className="text-ink-60 leading-relaxed">{body}</p>
    </div>
  );
}
