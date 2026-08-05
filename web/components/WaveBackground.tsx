"use client";
import dynamic from "next/dynamic";

const WaveField = dynamic(() => import("./WaveField"), { ssr: false });

/** Fixed, full-viewport interactive wave. R3F sizes a fixed canvas correctly
 * (100vw/vh). It's kept behind everything (z-0) and low opacity; the content
 * below the hero uses a solid background so the wave only shows behind the
 * hero. Click-through; the wave tracks the mouse on the window. */
export default function WaveBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-55" aria-hidden>
      <WaveField />
    </div>
  );
}
