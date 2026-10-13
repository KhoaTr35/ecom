import type { EventType } from "@/lib/analytics";

/** Fire-and-forget — analytics must never block or break the UI it's
 * instrumenting. No-ops silently if the visitor hasn't consented yet
 * (see `cookie-consent-banner.tsx`); the API route checks for that. */
export function trackClient(type: EventType, payload?: Record<string, unknown>) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  }).catch(() => {});
}
