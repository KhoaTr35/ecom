import { formatVnd } from "@/lib/utils";

const STEPS = ["Address", "Delivery", "Payment"] as const;

/** The 1-2-3 progress strip + collapsed order summary on mobile checkout
 * (design page 10). All three steps render on one scrolling page here (the
 * address/shipping/payment sections below), so every step shows as
 * "reached" — this is a progress indicator, not a wizard. */
export function MobileCheckoutSteps({ itemCount, total }: { itemCount: number; total: number }) {
  return (
    <div className="lg:hidden">
      <ol className="flex gap-1.5 px-4 pb-4">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <span className="block h-[3px] rounded-full bg-foreground" />
            <span className="mt-1.5 block text-[11px] font-semibold">
              {i + 1} {label}
            </span>
          </li>
        ))}
      </ol>

      {itemCount > 0 && (
        <details className="mx-4 rounded-xl border border-border px-3.5 py-3">
          <summary className="flex cursor-pointer items-center gap-2.5 text-sm">
            <span className="flex-1">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="font-semibold">{formatVnd(total)}</span>
          </summary>
        </details>
      )}
    </div>
  );
}
