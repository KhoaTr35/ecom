"use client";

import { useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatVnd } from "@/lib/utils";

type ProductHit = { id: string; name: string };
type OrderHit = { id: string; code: string; total: number };

/** Cmd/Ctrl+K jump palette. No admin detail routes exist yet (that's the
 * rest of IMP-23), so "jump" means scroll-to + highlight the row on the
 * existing list page via a URL hash, not navigate to a fake destination. */
export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [products, setProducts] = useState<ProductHit[]>([]);
  const [orders, setOrders] = useState<OrderHit[]>([]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || loaded) return;
    Promise.all([
      fetch("/api/admin/products").then((res) => res.json()),
      fetch("/api/admin/orders").then((res) => res.json()),
    ]).then(([productsJson, ordersJson]) => {
      setProducts(productsJson.data ?? []);
      setOrders(ordersJson.data ?? []);
      setLoaded(true);
    });
  }, [open, loaded]);

  function go(href: string) {
    setOpen(false);
    const [path, hash] = href.split("#");
    if (window.location.pathname === path) {
      // Same page: scroll + assign the hash directly — this is also what
      // actually satisfies CSS :target, which a client-side route push does
      // not (pushState alone never flips :target in Chromium/Firefox).
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.location.hash = hash;
    } else {
      // Cross-page: a full navigation so the browser sets :target on load,
      // same reason router.push alone doesn't work for the same-page case above.
      window.location.href = href;
    }
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Admin search" description="Jump to a product or order">
      <Command>
        <CommandInput placeholder="Search products or orders..." />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          {products.length > 0 && (
            <CommandGroup heading="Products">
              {products.map((p) => (
                <CommandItem key={p.id} value={p.name} onSelect={() => go(`/admin/products#product-${p.id}`)}>
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {orders.length > 0 && (
            <CommandGroup heading="Orders">
              {orders.map((o) => (
                <CommandItem key={o.id} value={o.code} onSelect={() => go(`/admin/orders#order-${o.id}`)}>
                  {o.code} — {formatVnd(o.total)}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
