import { pickBestRule } from "@/lib/pricing/rules";
import type { PriceContext, PriceInput, PriceLine, PriceQuote } from "@/lib/pricing/types";

export * from "@/lib/pricing/types";
export { vietnamWallClock } from "@/lib/pricing/rules";

/** Plan section 5.1 caps any single rule at half off. */
const MAX_PERCENT_OFF = 50;
/** Discounted unit prices are rounded down to a tidy VND amount. */
const ROUNDING_STEP = 1_000;

function applyDiscount(unitBase: number, percentOff: number): number {
  const capped = Math.min(Math.max(percentOff, 0), MAX_PERCENT_OFF);
  const discounted = unitBase * (1 - capped / 100);
  // Round down so the customer never pays more than the advertised discount.
  return Math.floor(discounted / ROUNDING_STEP) * ROUNDING_STEP;
}

/**
 * Pure price calculation — no DB access, `now` is injected so time-window
 * rules are testable. Used for both the storefront display price and the
 * authoritative total at checkout, so the two can never disagree.
 */
export function calculatePrice(input: PriceInput, ctx: PriceContext): PriceQuote {
  const lines: PriceLine[] = input.items.map(({ variantId, qty }) => {
    const variant = ctx.variants.get(variantId);
    const unitBase = variant?.basePrice ?? 0;

    const rule = variant
      ? pickBestRule(ctx.rules, { stock: variant.stock, categoryId: variant.categoryId }, input.segment, input.now)
      : null;

    // Only a discounted price is rounded; an undiscounted base price is left exact.
    const unitFinal = rule ? applyDiscount(unitBase, rule.percentOff) : unitBase;

    return {
      variantId,
      qty,
      unitBase,
      unitFinal,
      appliedRule: rule?.name,
      lineTotal: unitFinal * qty,
      name: variant?.name,
    };
  });

  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const discount = lines.reduce((sum, line) => sum + (line.unitBase - line.unitFinal) * line.qty, 0);

  const shippingMethod = ctx.shippingMethods.find((m) => m.code === input.shippingMethodCode);
  const shippingFee = !shippingMethod
    ? 0
    : shippingMethod.freeFrom != null && subtotal >= shippingMethod.freeFrom
      ? 0
      : shippingMethod.fee;

  return { lines, subtotal, discount, shippingFee, total: subtotal + shippingFee };
}
