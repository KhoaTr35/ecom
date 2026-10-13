import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { listCategories, listProducts, getCategoryFacets } from "@/lib/catalog";
import { toProductCards } from "@/lib/catalog/product-pricing";
import { SORT_VALUES, type CategoryFilterConfig, type ProductSort } from "@/lib/catalog/facets";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ProductCard } from "@/components/shop/product-card";
import { CategoryFilterSidebar } from "@/components/shop/category-filter-sidebar";
import { CategoryToolbar } from "@/components/shop/category-toolbar";
import { CategoryPagination } from "@/components/shop/category-pagination";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const categories = await listCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const categoryFilters = category.filters as unknown as CategoryFilterConfig;
  const facetKeys = [...(categoryFilters?.variantAxes ?? []), ...(categoryFilters?.filters ?? [])];

  const filters: Record<string, string[]> = {};
  for (const key of facetKeys) {
    const raw = firstValue(sp[key]);
    if (raw) filters[key] = raw.split(",").filter(Boolean);
  }
  const hasActiveFilters = Object.values(filters).some((values) => values.length > 0);

  const sortParam = firstValue(sp.sort);
  const sort: ProductSort = SORT_VALUES.includes(sortParam as ProductSort) ? (sortParam as ProductSort) : "newest";

  const page = Math.max(1, Number(firstValue(sp.page)) || 1);

  const [facets, { items: rawItems, total, pageSize }, user] = await Promise.all([
    getCategoryFacets(slug),
    listProducts({ categorySlug: slug, filters, sort, page }),
    getCurrentUser(await headers()),
  ]);
  const items = await toProductCards(rawItems, { userId: user?.id ?? null, now: new Date() });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const paginationParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (key === "page") continue;
    const first = firstValue(value);
    if (first) paginationParams.set(key, first);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/">Home</Link>} />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mb-12 border-b border-border pb-8">
        <h1 className="font-heading text-5xl leading-tight sm:text-6xl">{category.name}</h1>
      </header>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">
        <aside className="mb-10 lg:mb-0">
          <CategoryFilterSidebar facets={facets} />
        </aside>

        <div>
          <CategoryToolbar total={total} rangeStart={rangeStart} rangeEnd={rangeEnd} sort={sort} />

          {items.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No pieces match these filters</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? "Try removing a filter to see more results."
                    : "No products in this category yet."}
                </EmptyDescription>
              </EmptyHeader>
              {hasActiveFilters && (
                <Link
                  href={`/c/${slug}`}
                  className="label-eyebrow text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Clear filters
                </Link>
              )}
            </Empty>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <CategoryPagination pathname={`/c/${slug}`} searchParams={paginationParams} page={page} totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
