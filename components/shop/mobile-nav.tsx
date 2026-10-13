"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SHOP_LINKS, INFO_LINKS } from "@/components/shop/nav-links";

/** Category nav for small screens, where the desktop row does not fit. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="size-[18px]" strokeWidth={1.5} />
          </Button>
        }
      />
      <SheetContent side="left" className="w-[82%] max-w-xs px-6 py-6">
        <SheetTitle className="text-sm font-medium uppercase tracking-[0.3em]">Menu</SheetTitle>

        <ScrollArea className="mt-8 h-[calc(100%-2.5rem)]">
          <nav className="flex flex-col">
            {SHOP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-4 font-heading text-2xl"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <nav className="label-eyebrow mt-10 flex flex-col gap-4 text-muted-foreground">
            {INFO_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
