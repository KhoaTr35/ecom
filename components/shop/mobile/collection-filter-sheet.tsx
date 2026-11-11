"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CategoryFilterSidebar } from "@/components/shop/category-filter-sidebar";
import type { Facet, ProductSort } from "@/lib/catalog/facets";
import { cn } from "cn";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** Bottom sheet for sort + facets on mobile (design page 07) — writes the
 * exact query params the desktop sidebar/toolbar write (`sort`, one param
 * per facet key), so the same URL works on either breakpoint. Reuses
 * `CategoryFilterSidebar` for the facet checkboxes rather than a second
 * implementation of the same toggle-into-the-querystring logic. */
export function CollectionFilterSheet({
  facets,
  sort,
  total,
  open,
  onOpenChange,
}: {
  facets: Facet[];
  sort: ProductSort;
  total: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setSort(value: ProductSort) {
    const params = new URLSearchParams(searchParams);
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] gap-0 overflow-y-auto rounded-t-3xl px-5 pb-8 pt-3">
        <SheetTitle className="font-heading text-xl">Filter &amp; sort</SheetTitle>

        <fieldset className="mt-5 flex flex-col gap-2.5">
          <legend className="label-eyebrow text-muted-foreground">Sort by</legend>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                className={cn(
                  "h-10 rounded-full border px-3.5 text-xs",
                  option.value === sort
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <CategoryFilterSidebar facets={facets} />
        </div>

        <div className="mt-6 flex gap-2.5">
          <Button variant="outline" className="h-12" onClick={() => router.push(pathname)}>
            Clear
          </Button>
          <Button className="h-12 flex-1" onClick={() => onOpenChange(false)}>
            Show {total} {total === 1 ? "piece" : "pieces"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
