/** Decorative accent graphic tucked into the bottom-right of a feature card,
 * echoing the reference (flowing arcs, dot fields, chevrons, scattered dashes).
 * Pure inline SVG in the card's accent colour; clipped by the card's overflow. */
export default function CardDecor({
  variant,
  accent,
}: {
  variant: "waves" | "dots" | "chevron" | "dashes";
  accent: string;
}) {
  const cls = "pointer-events-none absolute bottom-0 right-0";

  if (variant === "waves") {
    return (
      <svg className={cls} width="190" height="160" viewBox="0 0 190 160" fill="none" aria-hidden>
        {[36, 62, 88, 114, 140, 166].map((r, i) => (
          <path
            key={r}
            d={`M ${190 - r} 160 A ${r} ${r} 0 0 1 190 ${160 - r}`}
            stroke={accent}
            strokeWidth="2"
            fill="none"
            opacity={0.55 - i * 0.07}
          />
        ))}
      </svg>
    );
  }

  if (variant === "dots") {
    const dots = [];
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        const cx = 50 + x * 26;
        const cy = 20 + y * 26;
        const d = Math.hypot(190 - cx, 160 - cy);
        const r = Math.max(1, 5.5 - d / 34);
        dots.push(
          <circle key={`${x}-${y}`} cx={cx} cy={cy} r={r} fill={accent} opacity={0.7} />
        );
      }
    }
    return (
      <svg className={cls} width="200" height="170" viewBox="0 0 200 170" fill="none" aria-hidden>
        {dots}
      </svg>
    );
  }

  if (variant === "chevron") {
    return (
      <svg className={cls} width="180" height="170" viewBox="0 0 180 170" fill="none" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={`M 40 ${170 - i * 26} L 110 ${118 - i * 26} L 180 ${170 - i * 26}`}
            stroke={accent}
            strokeWidth="7"
            fill="none"
            opacity={0.7 - i * 0.1}
          />
        ))}
      </svg>
    );
  }

  // dashes: scattered short strokes
  const seg = [
    [120, 40, 25], [150, 60, -40], [110, 80, 60], [170, 95, 10],
    [100, 120, -20], [140, 130, 45], [180, 140, -55], [125, 155, 30],
    [95, 60, 15], [160, 30, -30], [135, 100, 70], [105, 40, -10],
  ];
  return (
    <svg className={cls} width="200" height="180" viewBox="0 0 200 180" fill="none" aria-hidden>
      {seg.map(([x, y, rot], i) => (
        <line
          key={i}
          x1={x - 9}
          y1={y}
          x2={x + 9}
          y2={y}
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          opacity={0.75}
          transform={`rotate(${rot} ${x} ${y})`}
        />
      ))}
    </svg>
  );
}
