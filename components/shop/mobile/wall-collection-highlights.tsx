import Link from "next/link";
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
        <Link key={category.id} href={`/c/${category.slug}`} className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
          <span className="flex size-[66px] items-center justify-center rounded-full border border-border p-[3px]">
            <span
              className={
                i % 2 === 0
                  ? "flex size-full items-center justify-center rounded-full bg-foreground font-heading text-lg text-background"
                  : "flex size-full items-center justify-center rounded-full border border-border font-heading text-lg"
              }
            >
              {category.name[0]}
            </span>
          </span>
          <span className="text-center text-[11px] leading-tight">{category.name}</span>
        </Link>
      ))}
    </nav>
  );
}
