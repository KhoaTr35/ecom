"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductSort } from "@/lib/catalog/facets";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** Result-count line + sort control sitting above the product grid. */
export function CategoryToolbar({
  total,
  rangeStart,
  rangeEnd,
  sort,
}: {
  total: number;
  rangeStart: number;
  rangeEnd: number;
  sort: ProductSort;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setSort(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams);
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    params.delete("page");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="mb-10 flex items-center justify-between gap-4 border-b border-border pb-5">
      <p className="label-eyebrow text-muted-foreground">
        {total === 0 ? "0 pieces" : `${rangeStart}–${rangeEnd} of ${total}`}
      </p>
      <Select value={sort} onValueChange={setSort}>
        <SelectTrigger aria-label="Sort by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
