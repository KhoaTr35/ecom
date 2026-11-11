"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Package, Search, Settings, ShieldCheck, ShoppingBag, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { useGuestCart } from "@/components/shop/guest-cart-context";
import { SHOP_LINKS } from "@/components/shop/nav-links";
import type { AuthUser } from "@/lib/auth";
import { signOut, useSession } from "@/lib/auth/client";

export function Header() {
  const router = useRouter();
  const { count } = useGuestCart();
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const role = session ? (session.user as unknown as AuthUser).role : null;
  const isStaff = role === "STAFF" || role === "ADMIN";

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="text-base font-medium uppercase tracking-[0.3em] text-foreground">
          Atelier
        </Link>

        <nav className="label-eyebrow flex items-center gap-9 text-muted-foreground">
          {SHOP_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearchSubmit}>
          <InputGroup className="h-9 w-40 transition-[width] focus-within:w-56">
            <InputGroupInput
              type="search"
              placeholder="Search"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" aria-label="Search" size="icon-xs">
                <Search />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>

        <div className="flex items-center gap-1">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button type="button" aria-label="Account menu" className="flex items-center justify-center p-1.5">
                    <Avatar size="sm">
                      <AvatarFallback>{session.user.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                    </Avatar>
                  </button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  render={
                    <Link href="/account/orders">
                      <Package data-icon="inline-start" />
                      Orders
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link href="/account/settings">
                      <Settings data-icon="inline-start" />
                      Settings
                    </Link>
                  }
                />
                {isStaff && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      render={
                        <Link href="/admin">
                          <ShieldCheck data-icon="inline-start" />
                          Admin panel
                        </Link>
                      }
                    />
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                  <LogOut data-icon="inline-start" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              render={
                <Link href="/login" aria-label="Account">
                  <User className="size-[18px]" strokeWidth={1.5} />
                </Link>
              }
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            render={
              <Link href="/cart" aria-label={`Cart, ${count} items`}>
                <ShoppingBag className="size-[18px]" strokeWidth={1.5} />
                {count > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex size-[15px] items-center justify-center bg-foreground text-[10px] font-medium leading-none text-background">
                    {count}
                  </span>
                )}
              </Link>
            }
          />
        </div>
      </div>
    </header>
  );
}
