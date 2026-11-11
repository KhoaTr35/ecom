"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { INFO_LINKS } from "@/components/shop/nav-links";
import { cn } from "cn";

/** Pill tab row across the four legal pages (design page 16) — plain links
 * reading the same `INFO_LINKS` the footer uses, active state from the
 * current route (these are real routes, not client-side tab state). */
export function MobileInfoTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Policies" className="flex gap-2 overflow-x-auto border-b border-border px-4 pb-4 lg:hidden">
      {INFO_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold leading-9",
              active ? "border-foreground bg-foreground text-background" : "border-border",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
