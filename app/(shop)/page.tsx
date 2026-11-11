import Link from "next/link";
import { headers } from "next/headers";
import { listCategories, listProducts } from "@/lib/catalog";
import { toProductCards } from "@/lib/catalog/product-pricing";
import { listFeedItems, type FeedScope } from "@/lib/catalog/feed";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CollectionPosterGrid } from "@/components/shop/collection-poster-grid";
import { CollectionsSidebar } from "@/components/shop/collections-sidebar";
import { FeedReelScroller } from "@/components/shop/mobile/feed-reel-scroller";

const FEED_SCOPES: FeedScope[] = ["for-you", "new-in", "sale"];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope: scopeParam } = await searchParams;
  const scope = FEED_SCOPES.includes(scopeParam as FeedScope) ? (scopeParam as FeedScope) : "for-you";

  const user = await getCurrentUser(await headers());
  const [categories, { items }, feed] = await Promise.all([
    listCategories(),
    // Scoped to new-arrivals, matching the hero CTA and the "New Arrivals"
    // heading below — listProducts() with no categorySlug was pulling every
    // category in here, which the heading didn't actually say.
    listProducts({ categorySlug: "new-arrivals" }),
    listFeedItems({ scope, userId: user?.id ?? null }),
  ]);
  const categoryCounts = await Promise.all(
    categories.map((c) => listProducts({ categorySlug: c.slug, pageSize: 1 }).then((r) => r.total)),
  );
  const products = await toProductCards(items, { userId: user?.id ?? null, now: new Date() });

  const sidebarCategories = categories.map((category, i) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    count: categoryCounts[i],
  }));

  return (
    <>
      <div className="lg:hidden">
        <FeedReelScroller items={feed.items} scope={scope} />
      </div>
      <div className="hidden lg:block">
        <SidebarProvider defaultOpen={false}>
          <CollectionsSidebar categories={sidebarCategories} />
          <SidebarInset>
            <div className="sticky top-20 z-30 mx-auto w-full max-w-7xl px-5 pt-4 sm:px-8">
              <SidebarTrigger />
            </div>

            <section className="border-b border-border">
              <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
                <p className="label-eyebrow text-muted-foreground">Autumn / Winter 2026</p>
                {/* Oversized display type carries the page — no imagery or ornament needed. */}
                <h1 className="mt-7 max-w-4xl font-heading text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.92] tracking-[-0.03em]">
                  Considered pieces, <span className="italic">built to last</span>
                </h1>
                <p className="mt-9 max-w-md text-base leading-relaxed text-muted-foreground">
                  A pared-back wardrobe of tailoring, knitwear and accessories — made in small runs from
                  natural materials.
                </p>
                <Button
                  size="lg"
                  className="label-eyebrow mt-10 h-12 px-10"
                  render={<Link href="/c/new-arrivals">Shop the collection</Link>}
                />
              </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:pt-28">
              <h2 className="label-eyebrow border-b border-border pb-5 text-foreground">Collections</h2>
              <div className="mt-10">
                <CollectionPosterGrid collections={sidebarCategories} />
              </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
              <div className="mb-10 flex items-baseline justify-between border-b border-border pb-5">
                <h2 className="label-eyebrow text-foreground">New Arrivals</h2>
                <Link
                  href="/c/new-arrivals"
                  className="label-eyebrow text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  View all
                </Link>
              </div>

              {products.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
                  No products yet. Run <code>pnpm db:seed</code> to load sample data.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
}
