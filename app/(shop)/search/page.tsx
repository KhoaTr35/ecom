import { headers } from "next/headers";
import { listCategories, listProducts } from "@/lib/catalog";
import { toProductCards } from "@/lib/catalog/product-pricing";
import { SORT_VALUES, type ProductSort } from "@/lib/catalog/facets";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ProductCard } from "@/components/shop/product-card";
import { CategoryToolbar } from "@/components/shop/category-toolbar";
import { CategoryPagination } from "@/components/shop/category-pagination";
import { MobileSearchScreen } from "@/components/shop/mobile/mobile-search-screen";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = firstValue(sp.q)?.trim() ?? "";

  const sortParam = firstValue(sp.sort);
  const sort: ProductSort = SORT_VALUES.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "newest";
  const page = Math.max(1, Number(firstValue(sp.page)) || 1);

  const [{ items: rawItems, total, pageSize }, user, categories] = await Promise.all([
    q ? listProducts({ q, sort, page }) : Promise.resolve({ items: [], total: 0, page, pageSize: 24 }),
    getCurrentUser(await headers()),
    listCategories(),
  ]);
  const items = await toProductCards(rawItems, { userId: user?.id ?? null, now: new Date() });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const paginationParams = new URLSearchParams();
  if (q) paginationParams.set("q", q);
  if (sort !== "newest") paginationParams.set("sort", sort);

  const sidebarCategories = categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    count: 0,
  }));

  return (
    <>
      <MobileSearchScreen q={q} items={items} total={total} categories={sidebarCategories} />
      <div className="hidden lg:block">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <header className="mb-12 border-b border-border pb-8">
        <h1 className="font-heading text-5xl leading-tight sm:text-6xl">
          {q ? `Results for “${q}”` : "Search"}
        </h1>
      </header>

      {!q ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="font-heading text-2xl font-normal tracking-normal">
              Search for something
            </EmptyTitle>
            <EmptyDescription>Try a product name, like “wool coat”.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <CategoryToolbar total={total} rangeStart={rangeStart} rangeEnd={rangeEnd} sort={sort} />

          {items.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle className="font-heading text-2xl font-normal tracking-normal">
                  No results for “{q}”
                </EmptyTitle>
                <EmptyDescription>Try a different search term.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <CategoryPagination pathname="/search" searchParams={paginationParams} page={page} totalPages={totalPages} />
        </>
      )}
        </div>
      </div>
    </>
  );
}
