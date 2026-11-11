"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { CollectionFilterSheet } from "@/components/shop/mobile/collection-filter-sheet";
import type { Facet, ProductSort } from "@/lib/catalog/facets";

const SORT_LABEL: Record<ProductSort, string> = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

/** Sticky chip row above the mobile collection grid (design page 06) — one
 * chip per active facet value (removable in place) plus a chip that opens
 * the full filter/sort sheet. All read/write the same query params the
 * desktop sidebar uses. */
export function MobileFilterChips({ facets, sort, total }: { facets: Facet[]; sort: ProductSort; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeValues = facets.flatMap((facet) => {
    const selected = new Set((searchParams.get(facet.key) ?? "").split(",").filter(Boolean));
    return facet.values.filter((v) => selected.has(v.value)).map((v) => ({ key: facet.key, value: v.value }));
  });

  function removeValue(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    const remaining = new Set((params.get(key) ?? "").split(",").filter(Boolean));
    remaining.delete(value);
    if (remaining.size > 0) params.set(key, [...remaining].join(","));
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto border-y border-border px-4 py-2.5 lg:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-foreground px-3 text-xs font-semibold"
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={2} />
          Filters{activeValues.length > 0 ? ` · ${activeValues.length}` : ""}
        </button>
        {activeValues.map(({ key, value }) => (
          <button
            key={`${key}-${value}`}
            type="button"
            onClick={() => removeValue(key, value)}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs text-background"
          >
            {value}
            <X className="size-3" strokeWidth={2.4} />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex h-9 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-xs"
        >
          {SORT_LABEL[sort]}
        </button>
      </div>

      <CollectionFilterSheet facets={facets} sort={sort} total={total} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
