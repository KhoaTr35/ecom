import Link from "next/link";
import { cn } from "cn";
import type { SidebarCategory } from "@/components/shop/collections-sidebar";

/** One circular collection tile — monogram initial, alternating invert
 * treatment, name below. Shared by the Wall's highlight row and the
 * dedicated /collections browsing page so the one visual lives in one place. */
export function CollectionCircle({
  category,
  index,
  size = 66,
}: {
  category: SidebarCategory;
  index: number;
  size?: number;
}) {
  return (
    <Link href={`/c/${category.slug}`} className="flex flex-col items-center gap-1.5 text-center">
      <span
        className={cn(
          "flex items-center justify-center rounded-full font-heading text-lg",
          index % 2 === 0 ? "bg-foreground text-background" : "border border-border",
        )}
        style={{ width: size, height: size }}
      >
        {category.name[0]}
      </span>
      <span className="text-[11px] leading-tight">{category.name}</span>
    </Link>
  );
}
