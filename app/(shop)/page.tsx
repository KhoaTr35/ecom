import Link from "next/link";
import { headers } from "next/headers";
import { listProducts } from "@/lib/catalog";
import { toProductCards } from "@/lib/catalog/product-pricing";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const [{ items }, user] = await Promise.all([listProducts(), getCurrentUser(await headers())]);
  const products = await toProductCards(items, { userId: user?.id ?? null, now: new Date() });

  return (
    <div>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-36">
          <p className="label-eyebrow text-muted-foreground">Autumn / Winter 2026</p>
          {/* Oversized display type carries the page — no imagery or ornament needed. */}
          <h1 className="mt-7 max-w-4xl font-heading text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.92] tracking-[-0.03em]">
            Considered pieces, <span className="italic">built to last</span>
          </h1>
          <p className="mt-9 max-w-md text-base leading-relaxed text-muted-foreground">
            A pared-back wardrobe of tailoring, knitwear and accessories — made in small runs from
            natural materials.
          </p>
          <Button
            size="lg"
            className="label-eyebrow mt-10 h-12 px-10"
            render={<Link href="/c/new-arrivals">Shop the collection</Link>}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="mb-10 flex items-baseline justify-between border-b border-border pb-5">
          <h2 className="label-eyebrow text-foreground">New Arrivals</h2>
          <Link
            href="/c/new-arrivals"
            className="label-eyebrow text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="border border-dashed border-border p-8 text-sm text-muted-foreground">
            No products yet. Run <code>pnpm db:seed</code> to load sample data.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
