import Link from "next/link";
import { cn } from "cn";
import type { SidebarCategory } from "@/components/shop/collections-sidebar";

/** Poster "library" — each tile is the full click target (no separate CTA),
 * styled as a typographic poster (eyebrow count + large title) rather than a
 * fabricated banner image: Category has no image field, and this matches
 * the site's existing no-imagery, type-led editorial language. Tiles
 * alternate the site's standing invert treatment (bg-foreground/background)
 * so the grid reads as a wall of distinct posters, not repeated cards. */
export function CollectionPosterGrid({ collections }: { collections: SidebarCategory[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {collections.map((c, i) => (
        <Link
          key={c.id}
          href={`/c/${c.slug}`}
          className={cn(
            "group flex aspect-[3/4] flex-col justify-between border border-border p-5 transition-colors",
            i % 2 === 0
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "bg-background text-foreground hover:bg-muted",
          )}
        >
          <span className="label-eyebrow opacity-70">
            {c.count} {c.count === 1 ? "piece" : "pieces"}
          </span>
          <span className="font-heading text-2xl leading-tight transition-transform duration-500 ease-out group-hover:-translate-y-1 sm:text-3xl">
            {c.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
