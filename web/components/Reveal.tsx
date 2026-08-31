"use client";
import { useEffect, useRef, useState } from "react";

/** Fade + slide-up on scroll into view. Reveals once, then stops observing.
 * `delay` (ms) staggers siblings. Honors prefers-reduced-motion via CSS. */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Fallback: reveal anything already on screen at mount, and cover
    // environments where IntersectionObserver is missing or never fires.
    const inView = () => el.getBoundingClientRect().top < window.innerHeight * 0.9;
    if (typeof IntersectionObserver === "undefined" || inView()) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${shown ? " in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
