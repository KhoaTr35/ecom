"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const ACCOUNT_LINKS = [
  { href: "/account/orders", label: "Orders" },
  { href: "/account/settings", label: "Settings" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="label-eyebrow mb-10 flex gap-6 border-b border-border">
      {ACCOUNT_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "border-b-2 border-transparent pb-3 transition-colors",
              active ? "border-foreground text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
