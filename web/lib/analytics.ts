// Lightweight analytics shim for Level 4 monitoring.
// Uses Vercel Analytics + Speed Insights when deployed on Vercel,
// falls back to no-op locally so the build stays clean without extra deps.
// Replace with PostHog/Plausible by adding its script tag in layout.tsx if needed.

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // Vercel Analytics auto-captures; this is for custom events.
  // @ts-ignore - window.va may be injected by Vercel
  window.va?.("event", { name: event, data: props });
  // ponytail: naive console fallback — upgrade to PostHog when 10+ users need funnels
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, props);
  }
}

export function pageview(path: string) {
  track("pageview", { path });
}
