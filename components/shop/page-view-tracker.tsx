"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackClient } from "@/lib/analytics/client";

/** Mounted once in the shop layout — fires on every route change. Product
 * pages also emit `product_view`, the funnel's entry stage; everything else
 * only counts toward the site-wide "visits" KPI. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackClient("page_view", { path: pathname });
    if (pathname.startsWith("/p/")) trackClient("product_view", { path: pathname });
  }, [pathname]);

  return null;
}
