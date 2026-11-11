"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import type { SidebarCategory } from "@/components/shop/collections-sidebar";
import type { ProductCardData } from "@/lib/catalog/product-pricing";

const RECENT_KEY = "recent_searches";
const RECENT_LIMIT = 5;

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushRecent(query: string) {
  const next = [query, ...readRecent().filter((q) => q !== query)].slice(0, RECENT_LIMIT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

/** Search field + recent queries (client-only, localStorage) + results grid
 * + a browse-collections fallback (design page 08). `items`/`total` are
 * server-fetched for the current `q` — this component only owns the input
 * and the recent-search chips. */
export function MobileSearchScreen({
  q,
  items,
  total,
  categories,
}: {
  q: string;
  items: ProductCardData[];
  total: number;
  categories: SidebarCategory[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, an external non-React source
    setRecent(readRecent());
  }, []);

  function submit(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    pushRecent(trimmed);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="lg:hidden">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="flex items-center gap-2 px-4 pb-3 pt-11"
      >
        <label className="flex h-11 flex-1 items-center gap-2 rounded-xl bg-muted px-3">
          <SearchIcon className="size-[18px] text-muted-foreground" strokeWidth={1.8} />
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search products"
            className="flex-1 bg-transparent text-[15px] outline-none"
          />
        </label>
        <Link href="/" className="flex h-11 items-center px-1 text-sm">
          Cancel
        </Link>
      </form>

      {recent.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-3.5">
          <span className="shrink-0 self-center text-[11px] text-muted-foreground">Recent</span>
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => submit(term)}
              className="h-8 shrink-0 rounded-full border border-border px-3 text-xs"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {q && (
        <section className="border-t border-border px-4 pt-4">
          <span className="label-eyebrow text-muted-foreground">
            {total} {total === 1 ? "result" : "results"} · Newest
          </span>
          <h1 className="mt-1.5 font-heading text-[26px] leading-tight">Results for &ldquo;{q}&rdquo;</h1>

          {items.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No results — try a different search term.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-8">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="px-4 pt-6">
        <h2 className="label-eyebrow mb-3">Browse collections</h2>
        <div className="flex gap-4 overflow-x-auto">
          {categories.map((category, i) => (
            <Link key={category.id} href={`/c/${category.slug}`} className="flex w-[70px] shrink-0 flex-col items-center gap-1.5">
              <span
                className={
                  i % 2 === 0
                    ? "flex size-[62px] items-center justify-center rounded-full bg-foreground font-heading text-base text-background"
                    : "flex size-[62px] items-center justify-center rounded-full border border-border font-heading text-base"
                }
              >
                {category.name[0]}
              </span>
              <span className="text-center text-[11px] leading-tight">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
