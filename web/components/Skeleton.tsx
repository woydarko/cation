"use client";

/** Shimmer placeholder - PRD §5.3: never a blank screen, skeletons on load. */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-lg bg-ink-12 animate-pulse ${className}`}
      aria-hidden
    />
  );
}
