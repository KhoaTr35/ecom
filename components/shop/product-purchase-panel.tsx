"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGuestCart } from "@/components/shop/guest-cart-context";
import { trackClient } from "@/lib/analytics/client";
import type { PricedVariant } from "@/lib/catalog/product-pricing";
import { formatVnd } from "@/lib/utils";
import { cn } from "cn";

/** Variant selection plus the price and add-to-bag action it drives. */
export function ProductPurchasePanel({
  variants,
  axisLabel,
}: {
  variants: PricedVariant[];
  axisLabel: string;
}) {
  const { addItem } = useGuestCart();
  // Default to the first purchasable variant so the price shown is one you can buy.
  const [selectedId, setSelectedId] = useState(
    () => variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id ?? "",
  );

  const selected = variants.find((v) => v.id === selectedId);
  const soldOut = !selected || selected.stock === 0;
  const discounted = selected ? selected.unitFinal < selected.unitBase : false;

  return (
    <div>
      <p className="mt-4 flex items-baseline gap-3 text-lg">
        <span>{formatVnd(selected?.unitFinal ?? 0)}</span>
        {discounted && selected && (
          <>
            <span className="text-sm text-muted-foreground line-through">
              {formatVnd(selected.unitBase)}
            </span>
            {selected.appliedRule && (
              <span className="label-eyebrow text-foreground">{selected.appliedRule}</span>
            )}
          </>
        )}
      </p>

      {variants.length > 0 && (
        <fieldset className="mt-10">
          <legend className="label-eyebrow text-muted-foreground">{axisLabel}</legend>
          <ToggleGroup
            value={selectedId ? [selectedId] : []}
            onValueChange={(value) => {
              const next = value[0];
              if (next) setSelectedId(next);
            }}
            className="mt-3 flex-wrap gap-2"
          >
            {variants.map((variant) => {
              const available = variant.stock > 0;
              const isSelected = variant.id === selectedId;
              return (
                <ToggleGroupItem
                  key={variant.id}
                  value={variant.id}
                  disabled={!available}
                  className={cn(
                    "label-eyebrow min-h-11 rounded-lg border px-4 py-2.5 transition-colors disabled:pointer-events-none disabled:opacity-100",
                    !available &&
                      "cursor-not-allowed border-border bg-transparent text-muted-foreground line-through hover:bg-transparent",
                    available &&
                      isSelected &&
                      "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background",
                    available &&
                      !isSelected &&
                      "border-border bg-transparent hover:border-foreground hover:bg-transparent hover:text-foreground",
                  )}
                >
                  {variant.label}
                  <span className="sr-only">{available ? "" : " — sold out"}</span>
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </fieldset>
      )}

      <div className="mt-10">
        <Button
          size="lg"
          className="label-eyebrow h-12 w-full sm:w-80"
          disabled={soldOut}
          onClick={() => {
            if (!selected) return;
            addItem(selected.id, 1);
            trackClient("add_to_cart", { variantId: selected.id });
            toast.success(`Added ${selected.label} to bag`);
          }}
        >
          {soldOut ? "Sold out" : "Add to bag"}
        </Button>
        {selected && selected.stock > 0 && selected.stock <= 5 && (
          <p aria-live="polite" className="mt-3 text-sm text-muted-foreground">
            Only {selected.stock} left in {selected.label}
          </p>
        )}
      </div>
    </div>
  );
}
