import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function hrefForPage(pathname: string, searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams);
  if (page <= 1) params.delete("page");
  else params.set("page", String(page));

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Plain server-rendered links — no client state needed, works without JS. */
export function CategoryPagination({
  pathname,
  searchParams,
  page,
  totalPages,
}: {
  pathname: string;
  searchParams: URLSearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Pagination className="mt-16">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={hrefForPage(pathname, searchParams, page - 1)}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {pages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink href={hrefForPage(pathname, searchParams, p)} isActive={p === page}>
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={hrefForPage(pathname, searchParams, page + 1)}
            className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
