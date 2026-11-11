import { headers } from "next/headers";
import { listCategories, listProducts } from "@/lib/catalog";
import { toProductCards } from "@/lib/catalog/product-pricing";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollectionPosterGrid } from "@/components/shop/collection-poster-grid";
import { WallProfileHeader } from "@/components/shop/mobile/wall-profile-header";
import { WallCollectionHighlights } from "@/components/shop/mobile/wall-collection-highlights";
import { WallTileGrid } from "@/components/shop/mobile/wall-tile-grid";

/** The Wall (design page 05) — an Instagram-profile-style view of the whole
 * catalogue, reached by swiping right from the Feed or the bottom tab bar.
 * Desktop renders `CollectionPosterGrid`, the same component the homepage
 * already uses (decision 5) — not a second desktop design. */
export default async function WallPage() {
  const user = await getCurrentUser(await headers());
  const pricingOpts = { userId: user?.id ?? null, now: new Date() };

  const [categories, { items, total }] = await Promise.all([
    listCategories(),
    listProducts({ pageSize: 100, imagesLimit: 2 }),
  ]);
  const categoryCounts = await Promise.all(
    categories.map((c) => listProducts({ categorySlug: c.slug, pageSize: 1 }).then((r) => r.total)),
  );
  const sidebarCategories = categories.map((category, i) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    count: categoryCounts[i],
  }));

  const tiles = await toProductCards(items, pricingOpts);
  const onSale = tiles.filter((t) => t.fromPrice < t.fromBase);

  return (
    <>
      <WallProfileHeader
        stats={{ pieces: total, collections: categories.length, season: "AW26" }}
        tagline="Considered pieces, built to last. A pared-back wardrobe of tailoring, knitwear and accessories."
      />
      <WallCollectionHighlights categories={sidebarCategories} />

      <Tabs defaultValue="all" className="gap-0 lg:hidden">
        <TabsList variant="line" className="h-auto w-full justify-start gap-0 rounded-none border-t border-border p-0">
          <TabsTrigger value="all" className="h-[46px] flex-1 rounded-none">
            All · {tiles.length}
          </TabsTrigger>
          <TabsTrigger value="on-sale" className="h-[46px] flex-1 rounded-none">
            On sale · {onSale.length}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="pt-0.5">
          <WallTileGrid products={tiles} />
        </TabsContent>
        <TabsContent value="on-sale" className="pt-0.5">
          <WallTileGrid products={onSale} />
        </TabsContent>
      </Tabs>

      <div className="hidden px-5 py-20 sm:px-8 lg:block">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-heading text-5xl leading-tight">Collections</h1>
          <div className="mt-10">
            <CollectionPosterGrid collections={sidebarCategories} />
          </div>
        </div>
      </div>
    </>
  );
}
