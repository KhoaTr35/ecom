import { listCategories, listProducts } from "@/lib/catalog";
import { priceVariants, toProductCards, type PricedVariant, type ProductCardData } from "@/lib/catalog/product-pricing";

export type FeedProduct = {
  id: string;
  slug: string;
  categoryName: string;
  name: string;
  description: string;
  images: { url: string; alt: string }[];
  variants: PricedVariant[];
};

export type FeedCollectionReel = {
  slug: string;
  name: string;
  tagline: string | null;
  heroMediaUrl: string | null;
  totalCount: number;
  products: ProductCardData[];
};

export type FeedItem = { kind: "product"; product: FeedProduct } | { kind: "collection"; reel: FeedCollectionReel };

export type FeedScope = "for-you" | "new-in" | "sale";

/**
 * Mixes category reels into a product list, one reel every `every` slots —
 * the design's "collection reel every few products" (plan decision 1). Pure
 * so it's unit-testable without a database: reels cycle if there are fewer
 * reels than slots, and the feed degrades to products-only when `reels` is
 * empty rather than throwing or leaving gaps.
 */
export function interleaveFeed(products: FeedProduct[], reels: FeedCollectionReel[], every = 4): FeedItem[] {
  if (reels.length === 0) return products.map((product) => ({ kind: "product", product }));

  const items: FeedItem[] = [];
  let reelIndex = 0;
  products.forEach((product, i) => {
    items.push({ kind: "product", product });
    if ((i + 1) % every === 0) {
      items.push({ kind: "collection", reel: reels[reelIndex % reels.length] });
      reelIndex += 1;
    }
  });
  return items;
}

/** Builds one feed page: priced products for `scope`, interleaved with
 * collection reels drawn from categories that have reel copy (decision 1 —
 * `tagline`/`heroMediaUrl` are the only new columns, both nullable). */
// Course-project scale: fetching the whole catalogue in one page keeps the
// Feed showing every product rather than truncating to an arbitrary cap —
// desktop's "All Products" grid uses the same unpaginated approach.
const DEFAULT_FEED_PAGE_SIZE = 100;

export async function listFeedItems(params: { page?: number; pageSize?: number; scope?: FeedScope; userId?: string | null }) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_FEED_PAGE_SIZE;
  const scope = params.scope ?? "for-you";
  const now = new Date();
  const pricingOpts = { userId: params.userId ?? null, now };

  const categorySlug = scope === "new-in" ? "new-arrivals" : undefined;
  // Sale needs the full discounted pool before paging, so over-fetch here and
  // slice after filtering rather than paging the unfiltered query.
  const { items: candidates, total: candidateTotal } = await listProducts({
    categorySlug,
    page: scope === "sale" ? 1 : page,
    pageSize: scope === "sale" ? 200 : pageSize,
    imagesLimit: 4,
  });

  const priced = await Promise.all(
    candidates.map(async (product) => ({
      product,
      variants: await priceVariants(product.variants, pricingOpts),
    })),
  );

  const eligible =
    scope === "sale"
      ? priced.filter(({ variants }) => variants.some((v) => v.unitFinal < v.unitBase))
      : priced;

  const start = scope === "sale" ? (page - 1) * pageSize : 0;
  const pageSlice = scope === "sale" ? eligible.slice(start, start + pageSize) : eligible;

  const products: FeedProduct[] = pageSlice.map(({ product, variants }) => ({
    id: product.id,
    slug: product.slug,
    categoryName: product.category?.name ?? "",
    name: product.name,
    description: product.description,
    images: product.images.map((image) => ({ url: image.url, alt: image.alt })),
    variants,
  }));

  const categories = await listCategories();
  const reelCategories = categories.filter((c) => c.tagline);
  const reels: FeedCollectionReel[] = await Promise.all(
    reelCategories.map(async (category) => {
      const { items: reelProducts, total } = await listProducts({ categorySlug: category.slug, pageSize: 3 });
      return {
        slug: category.slug,
        name: category.name,
        tagline: category.tagline,
        heroMediaUrl: category.heroMediaUrl,
        totalCount: total,
        products: await toProductCards(reelProducts, pricingOpts),
      };
    }),
  );

  return {
    items: interleaveFeed(products, reels),
    total: scope === "sale" ? eligible.length : candidateTotal,
    page,
    pageSize,
  };
}
