export type FacetValue = { value: string; count: number };
export type Facet = { key: string; label: string; values: FacetValue[] };
export type ProductSort = "newest" | "price-asc" | "price-desc";
export const SORT_VALUES: ProductSort[] = ["newest", "price-asc", "price-desc"];

export type CategoryFilterConfig = { variantAxes?: string[]; filters?: string[] } | null | undefined;

type FacetableProduct = {
  attributes: unknown;
  variants: { options: unknown }[];
};

function capitalize(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function countValues(values: string[]): FacetValue[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

/**
 * Derives filter-sidebar facets from a category's own products: variant
 * option axes (size, color, ...) and product attribute filters (material,
 * ...) — both free-form JSON, per the `Category.filters` shape.
 */
export function buildCategoryFacets(products: FacetableProduct[], config: CategoryFilterConfig): Facet[] {
  const facets: Facet[] = [];

  for (const axis of config?.variantAxes ?? []) {
    const values = products.flatMap((product) => {
      const seen = new Set<string>();
      for (const variant of product.variants) {
        const value = readString((variant.options as Record<string, unknown> | null)?.[axis]);
        if (value) seen.add(value);
      }
      return [...seen];
    });
    if (values.length > 0) facets.push({ key: axis, label: capitalize(axis), values: countValues(values) });
  }

  for (const attrKey of config?.filters ?? []) {
    const values = products
      .map((product) => readString((product.attributes as Record<string, unknown> | null)?.[attrKey]))
      .filter((value): value is string => value !== null);
    if (values.length > 0) facets.push({ key: attrKey, label: capitalize(attrKey), values: countValues(values) });
  }

  return facets;
}

/**
 * A product matches when every active facet has at least one selected value
 * among its variant options or its attributes.
 */
export function matchesCategoryFilters(product: FacetableProduct, filters: Record<string, string[]>): boolean {
  return Object.entries(filters).every(([key, allowed]) => {
    if (allowed.length === 0) return true;
    const variantMatch = product.variants.some((variant) => {
      const value = readString((variant.options as Record<string, unknown> | null)?.[key]);
      return value !== null && allowed.includes(value);
    });
    const attrValue = readString((product.attributes as Record<string, unknown> | null)?.[key]);
    return variantMatch || (attrValue !== null && allowed.includes(attrValue));
  });
}

/**
 * Sorts by lowest variant base price; "newest" is a no-op since callers
 * already query in createdAt-desc order.
 */
export function sortCategoryProducts<T extends { variants: { basePrice: number }[] }>(
  products: T[],
  sort: ProductSort,
): T[] {
  if (sort === "newest") return products;
  const direction = sort === "price-asc" ? 1 : -1;
  return [...products].sort((a, b) => {
    const priceA = a.variants.length > 0 ? Math.min(...a.variants.map((v) => v.basePrice)) : Infinity;
    const priceB = b.variants.length > 0 ? Math.min(...b.variants.map((v) => v.basePrice)) : Infinity;
    return (priceA - priceB) * direction;
  });
}
