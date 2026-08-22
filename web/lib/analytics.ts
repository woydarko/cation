// Analytics for Level 4 monitoring. Vercel Analytics + Speed Insights are
// mounted in app/layout.tsx (page views + web vitals auto-captured). This
// helper sends custom events (deposits, draws seen, etc.).
import { track as vercelTrack } from "@vercel/analytics";

type Props = Record<string, string | number | boolean | null>;

export function track(event: string, props?: Props) {
  if (typeof window === "undefined") return;
  try {
    vercelTrack(event, props);
  } catch {
    /* analytics not ready (local dev) */
  }
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, props);
  }
}
