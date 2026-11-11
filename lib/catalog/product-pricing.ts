import { calculatePrice } from "@/lib/pricing";
import { buildPriceContext } from "@/lib/pricing/context";
import { resolveSegment } from "@/lib/pricing/segment";

type VariantLike = { id: string; sku: string; stock: number; options: unknown; basePrice: number };

export type PricedVariant = {
  id: string;
  label: string;
  sku: string;
  stock: number;
  unitBase: number;
  unitFinal: number;
  appliedRule?: string;
};

/** Variant options are free-form JSON ({ size: "M" } / { color: "Black" }). */
export function describeVariant(options: unknown, fallback: string): string {
  if (!options || typeof options !== "object") return fallback;
  const values = Object.values(options as Record<string, unknown>).filter(
    (value): value is string => typeof value === "string",
  );
  return values.length > 0 ? values.join(" / ") : fallback;
}

/**
 * Prices every variant of a product through `calculatePrice`, so the product
 * page advertises exactly what checkout will charge (plan section 5.1).
 */
export async function priceVariants(
  variants: VariantLike[],
  opts: { userId: string | null; now: Date },
): Promise<PricedVariant[]> {
  if (variants.length === 0) return [];

  const [ctx, segment] = await Promise.all([
    buildPriceContext(variants.map((v) => v.id)),
    resolveSegment(opts.userId),
  ]);

  // Quantity 1 per variant: we only need the per-unit price here.
  const quote = calculatePrice(
    { items: variants.map((v) => ({ variantId: v.id, qty: 1 })), segment, now: opts.now },
    ctx,
  );
  const lineByVariant = new Map(quote.lines.map((line) => [line.variantId, line]));

  return variants.map((variant) => {
    const line = lineByVariant.get(variant.id);
    return {
      id: variant.id,
      label: describeVariant(variant.options, variant.sku),
      sku: variant.sku,
      stock: variant.stock,
      unitBase: line?.unitBase ?? variant.basePrice,
      unitFinal: line?.unitFinal ?? variant.basePrice,
      appliedRule: line?.appliedRule,
    };
  });
}

type ProductLike = {
  id: string;
  slug: string;
  name: string;
  images: { url: string; alt: string }[];
  variants: VariantLike[];
};

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  image: { url: string; alt: string } | null;
  /** Lowest purchasable price after price rules. */
  fromPrice: number;
  fromBase: number;
  inStock: boolean;
  /** Drives the Wall's "multi-image" marker — there is no `reel` video
   * field (plan decision 2), so this is the honest substitute. */
  imageCount: number;
};

/**
 * Builds product-grid data with rule-applied prices, so a listing can never
 * advertise a different price from the product page it links to.
 */
export async function toProductCards(
  products: ProductLike[],
  opts: { userId: string | null; now: Date },
): Promise<ProductCardData[]> {
  const allVariants = products.flatMap((product) => product.variants);
  const priced = await priceVariants(allVariants, opts);
  const pricedById = new Map(priced.map((variant) => [variant.id, variant]));

  return products.map((product) => {
    const variants = product.variants
      .map((variant) => pricedById.get(variant.id))
      .filter((variant): variant is PricedVariant => variant != null);

    // Quote from the cheapest variant a customer can actually buy; fall back to
    // the whole range when everything is sold out.
    const inStock = variants.some((variant) => variant.stock > 0);
    const quotable = inStock ? variants.filter((variant) => variant.stock > 0) : variants;

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] ?? null,
      fromPrice: Math.min(...quotable.map((v) => v.unitFinal)),
      fromBase: Math.min(...quotable.map((v) => v.unitBase)),
      inStock,
      imageCount: product.images.length,
    };
  });
}
