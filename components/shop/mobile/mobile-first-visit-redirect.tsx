"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const VISITED_KEY = "atelier_mobile_visited";
// Matches Tailwind's `lg` breakpoint (1024px) — the same cutoff every
// `lg:hidden` / `hidden lg:block` pair in this redesign uses. Deliberately
// not the `useIsMobile` hook, which gates at 768px and would disagree with
// what the CSS actually shows between 768-1023px.
const LG_BREAKPOINT_PX = 1024;

/**
 * The Wall is the default landing screen on a visitor's first mobile visit
 * to the homepage; the Feed tab (which also points to "/") works normally
 * afterward since the session flag is already set. Desktop never redirects —
 * gated on actual viewport width, not the CSS visibility of this component's
 * `lg:hidden` wrapper, which still runs on desktop (just hidden, not unmounted).
 */
export function MobileFirstVisitRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem(VISITED_KEY)) return;
    sessionStorage.setItem(VISITED_KEY, "1");
    if (window.innerWidth < LG_BREAKPOINT_PX) router.replace("/wall");
  }, [router]);

  return null;
}
