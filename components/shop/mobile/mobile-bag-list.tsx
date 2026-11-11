import { ShoppingBag } from "lucide-react";
import { formatVnd } from "@/lib/utils";
import type { PriceLine } from "@/lib/pricing";

/** Bag line list for mobile (design page 09) — qty stepper instead of a
 * number input, plain "Remove" (the design's own swipe-to-remove hint has
 * no confirmation step either). No product thumbnail: `PriceLine` carries
 * no image, and a fabricated one would be worse than none. */
export function MobileBagList({
  lines,
  onUpdateQty,
  onRemove,
}: {
  lines: PriceLine[];
  onUpdateQty: (variantId: string, qty: number) => void;
  onRemove: (variantId: string) => void;
}) {
  return (
    <ul className="divide-y divide-border border-y border-border lg:hidden">
      {lines.map((line) => (
        <li key={line.variantId} className="flex gap-3.5 py-4">
          <span className="flex size-[72px] shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ShoppingBag className="size-5" strokeWidth={1.6} />
          </span>
          <div className="flex flex-1 flex-col gap-1">
            <div className="flex justify-between gap-2">
              <p className="text-sm">{line.name ?? line.variantId}</p>
              <p className="text-sm">{formatVnd(line.lineTotal)}</p>
            </div>
            <p className="text-xs text-muted-foreground">{formatVnd(line.unitFinal)} each</p>
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center rounded-md border border-border">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => onUpdateQty(line.variantId, line.qty - 1)}
                  className="flex size-10 items-center justify-center text-lg"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm">{line.qty}</span>
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => onUpdateQty(line.variantId, line.qty + 1)}
                  className="flex size-10 items-center justify-center text-lg"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(line.variantId)}
                className="min-h-11 text-xs text-muted-foreground underline underline-offset-4"
              >
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
