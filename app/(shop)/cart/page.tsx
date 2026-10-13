"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGuestCart } from "@/components/shop/guest-cart-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { PriceQuote } from "@/lib/pricing";
import { formatVnd } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQty, removeItem, hydrated } = useGuestCart();
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Empty cart renders its own early-return UI below — nothing to quote.
    if (items.length === 0) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, no query lib in this skeleton
    setLoading(true);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((json) => setQuote(json.data))
      .finally(() => setLoading(false));
  }, [items]);

  if (!hydrated) {
    // Guest cart reads localStorage after mount — an empty `items` before this
    // is "not loaded yet", not "genuinely empty". Show a generic skeleton
    // instead of flashing the empty-bag state first.
    return (
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <h1 className="font-heading text-5xl leading-tight">Shopping bag</h1>
        <div className="mt-12 divide-y divide-border border-y border-border">
          {Array.from({ length: 2 }).map((_, i) => (
            <CartLineSkeleton key={i} />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 py-32">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="font-heading text-4xl font-normal tracking-normal">
              Your bag is empty
            </EmptyTitle>
            <EmptyDescription>Pieces you add will be kept here while you browse.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              size="lg"
              className="label-eyebrow h-12 px-10"
              render={<Link href="/c/new-arrivals">Continue shopping</Link>}
            />
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
      <h1 className="font-heading text-5xl leading-tight">Shopping bag</h1>

      <div className="mt-12 divide-y divide-border border-y border-border">
        {/* First load has no priced lines yet — skeleton rows stand in for them.
            A later revalidation (qty change) keeps showing the stale quote instead
            of flashing back to skeletons. */}
        {!quote && loading
          ? items.map((item) => <CartLineSkeleton key={item.variantId} />)
          : quote?.lines.map((line) => (
              <div key={line.variantId} className="flex items-start justify-between gap-6 py-6">
                <div className="min-w-0">
                  <p className="text-sm">{line.name ?? line.variantId}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatVnd(line.unitFinal)}</p>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <button
                          type="button"
                          className="label-eyebrow mt-4 text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                        >
                          Remove
                        </button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove from bag?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {line.name ?? line.variantId} will be removed from your shopping bag.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeItem(line.variantId)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="flex items-center gap-6">
                  <Input
                    type="number"
                    min={0}
                    aria-label="Quantity"
                    value={line.qty}
                    onChange={(e) => updateQty(line.variantId, Number(e.target.value))}
                    className="h-11 w-16 text-center"
                  />
                  <p className="w-28 shrink-0 text-right text-sm">{formatVnd(line.lineTotal)}</p>
                </div>
              </div>
            ))}
      </div>

      {quote ? (
        <div className="mt-8 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatVnd(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex justify-between border-t border-border pt-4 text-base">
            <span>Total</span>
            <span>{formatVnd(quote.subtotal)}</span>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      )}

      <Button
        size="lg"
        className="label-eyebrow mt-10 h-12 w-full"
        render={<Link href="/checkout">Proceed to checkout</Link>}
      />
    </div>
  );
}

function CartLineSkeleton() {
  return (
    <div className="flex items-start justify-between gap-6 py-6">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="h-11 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
