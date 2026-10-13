import { prisma } from "@/lib/db";
import { listShippingMethods } from "@/lib/shipping";
import { mockPriceRules, mockVariantsById } from "@/lib/mock-data";
import type { PriceContext } from "@/lib/pricing/types";

/**
 * Gathers everything `calculatePrice` needs for a set of variants. Shared by
 * the cart quote and the product page so a displayed price can never diverge
 * from the price charged at checkout.
 *
 * Falls back to static mock data when no database is reachable, which keeps
 * the storefront browsable without any backend configured.
 */
export async function buildPriceContext(variantIds: string[]): Promise<PriceContext> {
  try {
    const [variants, rules, shippingMethods] = await Promise.all([
      prisma.productVariant.findMany({ where: { id: { in: variantIds } }, include: { product: true } }),
      prisma.priceRule.findMany({ where: { active: true } }),
      listShippingMethods(),
    ]);

    return {
      variants: new Map(
        variants.map((v) => [
          v.id,
          { basePrice: v.basePrice, stock: v.stock, categoryId: v.product.categoryId, name: v.product.name },
        ]),
      ),
      rules,
      shippingMethods: shippingMethods.map((m) => ({ code: m.code, fee: m.fee, freeFrom: m.freeFrom })),
    };
  } catch {
    const shippingMethods = await listShippingMethods(); // already falls back internally
    return {
      variants: new Map(
        variantIds
          .map((id) => mockVariantsById.get(id))
          .filter((v): v is NonNullable<typeof v> => v != null)
          .map((v) => [
            v.id,
            { basePrice: v.basePrice, stock: v.stock, categoryId: v.product.categoryId, name: v.product.name },
          ]),
      ),
      rules: mockPriceRules,
      shippingMethods: shippingMethods.map((m) => ({ code: m.code, fee: m.fee, freeFrom: m.freeFrom })),
    };
  }
}
