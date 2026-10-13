import { prisma } from "@/lib/db";
import { mockProducts } from "@/lib/mock-data";

function mockSimilar(productId: string, limit: number) {
  const product = mockProducts.find((p) => p.id === productId);
  if (!product) return mockProducts.slice(0, limit);
  return mockProducts.filter((p) => p.id !== productId && p.categoryId === product.categoryId).slice(0, limit);
}

export async function similarProducts(productId: string, limit = 8) {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return mockSimilar(productId, limit);

    const items = await prisma.product.findMany({
      where: {
        id: { not: productId },
        categoryId: product.categoryId,
        status: "ACTIVE",
        variants: { some: { stock: { gt: 0 } } },
      },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: true },
      take: limit,
    });
    return items;
  } catch {
    return mockSimilar(productId, limit);
  }
}

/** Ranks sibling products by how often they co-occur in the same order as
 * the product being viewed — most-frequent first. Pure so it's testable
 * without a database. */
export function rankCoPurchasedProducts(siblingProductIds: string[], excludeProductId: string, limit: number): string[] {
  const counts = new Map<string, number>();
  for (const id of siblingProductIds) {
    if (id === excludeProductId) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

/** "Frequently bought together" — counts co-occurrence across PAID/DELIVERED
 * orders. Falls back to `similarProducts` (same-category) for products with
 * no order history yet, and pads a partial ranking (e.g. a co-purchased
 * product has since sold out) with same-category picks up to `limit`. */
export async function boughtTogether(productId: string, limit = 4) {
  try {
    const variants = await prisma.productVariant.findMany({ where: { productId }, select: { id: true } });
    if (variants.length === 0) return similarProducts(productId, limit);

    const ownOrders = await prisma.orderItem.findMany({
      where: { variantId: { in: variants.map((v) => v.id) }, order: { status: { in: ["PAID", "DELIVERED"] } } },
      select: { orderId: true },
    });
    const orderIds = [...new Set(ownOrders.map((o) => o.orderId))];
    if (orderIds.length === 0) return similarProducts(productId, limit);

    const siblingItems = await prisma.orderItem.findMany({
      where: { orderId: { in: orderIds } },
      select: { variant: { select: { productId: true } } },
    });

    const rankedIds = rankCoPurchasedProducts(siblingItems.map((i) => i.variant.productId), productId, limit);
    if (rankedIds.length === 0) return similarProducts(productId, limit);

    const products = await prisma.product.findMany({
      where: { id: { in: rankedIds }, status: "ACTIVE", variants: { some: { stock: { gt: 0 } } } },
      include: { images: { take: 1, orderBy: { sortOrder: "asc" } }, variants: true },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const ranked = rankedIds.map((id) => byId.get(id)).filter((p): p is (typeof products)[number] => p !== undefined);

    if (ranked.length < limit) {
      const seen = new Set(ranked.map((p) => p.id));
      for (const extra of await similarProducts(productId, limit - ranked.length)) {
        if (!seen.has(extra.id)) {
          ranked.push(extra);
          seen.add(extra.id);
        }
      }
    }
    return ranked.slice(0, limit);
  } catch {
    return similarProducts(productId, limit);
  }
}
