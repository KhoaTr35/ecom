import { CollectionCircle } from "@/components/shop/mobile/collection-circle";
import type { SidebarCategory } from "@/components/shop/collections-sidebar";

/** Story-circle row of every collection (design page 05) — type-led
 * monogram tiles, no fabricated photography (Category has no image field,
 * same stance as CollectionPosterGrid). This is what closes the gap the
 * README calls out: header/footer only hardcode 3 links, the Wall lists
 * all 7. */
export function WallCollectionHighlights({ categories }: { categories: SidebarCategory[] }) {
  return (
    <nav aria-label="Collections" className="flex gap-4 overflow-x-auto px-4 py-4 lg:hidden">
      {categories.map((category, i) => (
        <div key={category.id} className="w-[70px] shrink-0">
          <CollectionCircle category={category} index={i} />
        </div>
      ))}
    </nav>
  );
}
