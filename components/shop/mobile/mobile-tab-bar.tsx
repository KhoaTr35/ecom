"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Play, Search, ShoppingBag, User } from "lucide-react";
import { useGuestCart } from "@/components/shop/guest-cart-context";
import { cn } from "cn";

const TABS = [
  { href: "/wall", label: "Wall", icon: LayoutGrid },
  { href: "/search", label: "Search", icon: Search },
  { href: "/", label: "Feed", icon: Play },
  { href: "/cart", label: "Bag", icon: ShoppingBag },
  { href: "/account/orders", label: "Me", icon: User },
] as const;

/** Replaces the hamburger menu + header icons on mobile (design page 00's
 * route map): one bottom bar on every screen. `env(safe-area-inset-bottom)`
 * clears the home indicator on notched phones — see the `viewport` export in
 * app/layout.tsx for the matching `viewportFit: "cover"`. */
export function MobileTabBar() {
  const pathname = usePathname();
  // The Feed is a dark reel surface (bg-feed) — its bottom nav matches,
  // every other screen keeps the light storefront nav.
  const onFeed = pathname === "/";

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t lg:hidden",
        onFeed ? "border-white/10 bg-feed" : "border-border bg-background",
      )}
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 min-w-14 flex-col items-center justify-center gap-1 pt-2 text-[10px]",
              onFeed
                ? active
                  ? "font-medium text-feed-foreground"
                  : "text-feed-foreground/70"
                : active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
            )}
          >
            <TabIcon href={href} Icon={Icon} active={active} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function TabIcon({ href, Icon, active }: { href: string; Icon: typeof Play; active: boolean }) {
  const { count } = useGuestCart();
  const isBag = href === "/cart";
  const isSearch = href === "/search";

  return (
    <span className="relative">
      <Icon
        className="size-[22px]"
        strokeWidth={isSearch && active ? 2.4 : 1.6}
        fill={!isSearch && active ? "currentColor" : "none"}
      />
      {isBag && count > 0 && (
        <span className="absolute -right-2 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-white">
          {count}
        </span>
      )}
    </span>
  );
}
