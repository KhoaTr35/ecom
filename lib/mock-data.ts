// Static fallback data so the storefront is browsable without a database or
// backend configured. Derived from prisma/seed-data.json so there is one
// source of truth for demo content; used by lib/catalog, lib/shipping,
// lib/cart and lib/recommend whenever a Prisma call throws.
import seedData from "@/prisma/seed-data.json";

export const mockCategories = seedData.categories.map((c, i) => ({
  id: `mock-cat-${i + 1}`,
  slug: c.slug,
  name: c.name,
  filters: c.filters,
}));

const categoryIdBySlug = new Map(mockCategories.map((c) => [c.slug, c.id]));

export const mockProducts = seedData.products.map((p, pi) => {
  const id = `mock-prod-${pi + 1}`;
  return {
    id,
    categoryId: categoryIdBySlug.get(p.categorySlug)!,
    slug: p.slug,
    name: p.name,
    brand: null as string | null,
    description: p.description,
    attributes: p.attributes,
    status: "ACTIVE",
    createdAt: new Date(),
    category: mockCategories.find((c) => c.slug === p.categorySlug)!,
    images: p.images.map((img, ii) => ({
      id: `mock-img-${pi + 1}-${ii + 1}`,
      productId: id,
      url: img.url,
      alt: img.alt,
      sortOrder: ii,
    })),
    variants: p.variants.map((v, vi) => ({
      id: `mock-var-${pi + 1}-${vi + 1}`,
      productId: id,
      sku: v.sku,
      options: v.options,
      basePrice: v.basePrice,
      stock: v.stock,
    })),
  };
});

export const mockShippingMethods = seedData.shippingMethods.map((m) => ({ ...m, active: true }));

export const mockVariantsById = new Map(
  mockProducts.flatMap((p) => p.variants.map((v) => [v.id, { ...v, product: p }])),
);

/** Seed price rules, so the pricing engine is exercised in no-database mode too. */
export const mockPriceRules = seedData.priceRules.map((rule, i) => ({
  id: `mock-rule-${i + 1}`,
  name: rule.name,
  type: rule.type as "TIME_WINDOW" | "STOCK_LEVEL" | "SEGMENT",
  condition: rule.condition as unknown,
  percentOff: rule.percentOff,
  priority: rule.priority,
  active: true,
}));
