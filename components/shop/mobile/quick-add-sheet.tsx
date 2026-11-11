"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGuestCart } from "@/components/shop/guest-cart-context";
import { trackClient } from "@/lib/analytics/client";
import { formatVnd } from "@/lib/utils";
import { cn } from "cn";
import type { FeedProduct } from "@/lib/catalog/feed";

/** Bottom sheet opened from the Feed's right-hand rail (design page 03) —
 * the same add-to-bag flow as `ProductPurchasePanel`, just reachable without
 * leaving the reel. */
export function QuickAddSheet({
  product,
  open,
  onOpenChange,
}: {
  product: FeedProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addItem } = useGuestCart();
  const [selectedId, setSelectedId] = useState(
    () => product.variants.find((v) => v.stock > 0)?.id ?? product.variants[0]?.id ?? "",
  );
  const selected = product.variants.find((v) => v.id === selectedId);
  const soldOut = !selected || selected.stock === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-3">
        <SheetTitle className="sr-only">Choose a size — {product.name}</SheetTitle>
        <div className="flex gap-3.5 pr-10">
          <div className="relative h-24 w-[72px] flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {product.images[0] && (
              <Image src={product.images[0].url} alt={product.images[0].alt} fill className="object-cover" />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="label-eyebrow text-muted-foreground">{product.categoryName}</span>
            <h2 className="font-heading text-xl leading-tight">{product.name}</h2>
            <p className="text-sm">{formatVnd(selected?.unitFinal ?? 0)}</p>
          </div>
        </div>

        {product.variants.length > 0 && (
          <fieldset className="mt-4">
            <div className="flex items-baseline justify-between">
              <legend className="label-eyebrow">Size</legend>
              {selected && selected.stock > 0 && selected.stock <= 5 && (
                <span className="text-xs text-muted-foreground">Only {selected.stock} left in {selected.label}</span>
              )}
            </div>
            <ToggleGroup
              value={selectedId ? [selectedId] : []}
              onValueChange={(value) => {
                const next = value[0];
                if (next) setSelectedId(next);
              }}
              className="mt-2.5 grid grid-cols-4 gap-2"
            >
              {product.variants.map((variant) => {
                const available = variant.stock > 0;
                return (
                  <ToggleGroupItem
                    key={variant.id}
                    value={variant.id}
                    disabled={!available}
                    className={cn(
                      "h-12 rounded-lg border text-sm disabled:line-through disabled:opacity-100",
                      !available && "border-dashed text-muted-foreground",
                    )}
                  >
                    {variant.label}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </fieldset>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="h-12" render={<Link href={`/p/${product.slug}`}>Details</Link>} />
          <Button
            className="h-12 flex-1"
            disabled={soldOut}
            onClick={() => {
              if (!selected) return;
              addItem(selected.id, 1);
              trackClient("add_to_cart", { variantId: selected.id });
              toast.success(`Added ${selected.label} to bag`);
              onOpenChange(false);
            }}
          >
            {soldOut ? "Sold out" : `Add to bag · ${formatVnd(selected?.unitFinal ?? 0)}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
