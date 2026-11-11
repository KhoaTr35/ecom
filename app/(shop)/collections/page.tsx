import { listCategories, listProducts } from "@/lib/catalog";
import { CollectionPosterGrid } from "@/components/shop/collection-poster-grid";
import { CollectionCircle } from "@/components/shop/mobile/collection-circle";
import { MobileScreenHeader } from "@/components/shop/mobile/mobile-screen-header";

/** Dedicated "browse all collections" page — the destination for the Wall's
 * COLLECTIONS button and the Search page's Browse collections link, so
 * neither has to embed its own copy of the same grid. Desktop reuses
 * CollectionPosterGrid, the one collections grid this project already has
 * (decision 5's precedent, same as the Wall). */
export default async function CollectionsPage() {
  const categories = await listCategories();
  const categoryCounts = await Promise.all(
    categories.map((c) => listProducts({ categorySlug: c.slug, pageSize: 1 }).then((r) => r.total)),
  );
  const sidebarCategories = categories.map((category, i) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    count: categoryCounts[i],
  }));

  return (
    <>
      <div className="lg:hidden">
        <MobileScreenHeader backHref="/wall" title="Collections" />
        <div className="grid grid-cols-3 gap-x-4 gap-y-8 px-4 pb-10 pt-2">
          {sidebarCategories.map((category, i) => (
            <CollectionCircle key={category.id} category={category} index={i} size={88} />
          ))}
        </div>
      </div>

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
