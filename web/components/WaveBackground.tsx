/** Hero background: the designed violet artwork (public/bg.png). Fixed and
 * click-through, masked so it fades into the solid page below. The image
 * carries the composition (soft violet arcs on the right, clean space on the
 * left for the left-aligned hero copy). */
export default function WaveBackground() {
  const fade = "linear-gradient(to bottom, #000 55%, transparent 92%)";
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "top right",
        backgroundRepeat: "no-repeat",
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
      aria-hidden
    />
  );
}
