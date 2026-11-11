import { prisma } from "@/lib/db";
import { mockCategories, mockProducts } from "@/lib/mock-data";
import {
  buildCategoryFacets,
  matchesCategoryFilters,
  sortCategoryProducts,
  type CategoryFilterConfig,
  type ProductSort,
} from "@/lib/catalog/facets";

export async function listCategories() {
  try {
    return await prisma.category.findMany({ orderBy: { name: "asc" } });
  } catch {
    return mockCategories;
  }
}

/** Every ACTIVE product matching category/search, unpaginated — the shared
 * base for both the product grid and the filter sidebar's facet counts.
 * `imagesLimit` defaults to 1 (grid card only shows one); the mobile feed's
 * story bars pass a higher limit to get the full gallery. */
async function getCandidateProducts(params: { categorySlug?: string; q?: string; imagesLimit?: number }) {
  try {
    const where = {
      status: "ACTIVE",
      ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
      ...(params.q ? { name: { contains: params.q, mode: "insensitive" as const } } : {}),
    };

    return await prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: params.imagesLimit ?? 1 },
        variants: true,
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return mockProducts.filter((p) => {
      if (params.categorySlug && p.category.slug !== params.categorySlug) return false;
      if (params.q && !p.name.toLowerCase().includes(params.q.toLowerCase())) return false;
      return true;
    });
  }
}

export async function listProducts(
  params: {
    categorySlug?: string;
    q?: string;
    page?: number;
    pageSize?: number;
    sort?: ProductSort;
    filters?: Record<string, string[]>;
    imagesLimit?: number;
  } = {},
) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 24;

  const candidates = await getCandidateProducts(params);
  const filtered = params.filters
    ? candidates.filter((product) => matchesCategoryFilters(product, params.filters!))
    : candidates;
  const sorted = sortCategoryProducts(filtered, params.sort ?? "newest");

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  return { items: sorted.slice(start, start + pageSize), total, page, pageSize };
}

/** Facet options for a category's filter sidebar, derived from every product
 * in the category regardless of currently applied filters — narrowing one
 * facet shouldn't hide the others. */
export async function getCategoryFacets(categorySlug: string) {
  const categories = await listCategories();
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) return [];

  const candidates = await getCandidateProducts({ categorySlug });
  return buildCategoryFacets(candidates, category.filters as unknown as CategoryFilterConfig);
}

export async function getProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { images: { orderBy: { sortOrder: "asc" } }, variants: true, category: true },
    });
    return product ?? mockProducts.find((p) => p.slug === slug) ?? null;
  } catch {
    return mockProducts.find((p) => p.slug === slug) ?? null;
  }
}
