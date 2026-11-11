import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { priceVariants, toProductCards } from "@/lib/catalog/product-pricing";
import { boughtTogether, similarProducts } from "@/lib/recommend";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/shop/product-card";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { MobileProductDetail } from "@/components/shop/mobile/mobile-product-detail";
import { formatVnd } from "@/lib/utils";

/**
 * Labels the picker from the variants' own option keys (`{ size: "M" }`), not
 * from the category's declared axes — a category may mix axes, and the label
 * must describe what is actually on screen.
 */
function variantAxisLabel(variants: { options: unknown }[]): string {
  const keys = new Set<string>();
  for (const variant of variants) {
    if (variant.options && typeof variant.options === "object") {
      Object.keys(variant.options as Record<string, unknown>).forEach((key) => keys.add(key));
    }
  }
  if (keys.size === 0) return "Options";
  return [...keys].map((key) => key.replace(/^./, (c) => c.toUpperCase())).join(" / ");
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const user = await getCurrentUser(await headers());
  const pricingOpts = { userId: user?.id ?? null, now: new Date() };
  const [variants, relatedRaw, togetherRaw] = await Promise.all([
    // Priced through calculatePrice so this page shows what checkout will charge.
    priceVariants(product.variants, pricingOpts),
    similarProducts(product.id, 4),
    boughtTogether(product.id, 4),
  ]);
  const related = await toProductCards(relatedRaw, pricingOpts);
  // boughtTogether falls back to similarProducts when a product has no order
  // history yet — in that case it's the same list, so don't show it twice.
  const sameAsRelated = togetherRaw.length === relatedRaw.length && togetherRaw.every((p, i) => p.id === relatedRaw[i]?.id);
  const together = sameAsRelated ? [] : await toProductCards(togetherRaw, pricingOpts);

  return (
    <div>
      <MobileProductDetail
        product={product}
        variants={variants}
        axisLabel={variantAxisLabel(product.variants)}
        together={together}
        related={related}
      />

      <div className="mx-auto hidden max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid lg:grid-cols-2 lg:gap-20 lg:py-16">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>

        <div className="lg:sticky lg:top-32 lg:self-start lg:py-10">
          <h1 className="font-heading text-4xl leading-tight sm:text-5xl">{product.name}</h1>

          <ProductPurchasePanel
            variants={variants}
            axisLabel={variantAxisLabel(product.variants)}
          />

          <Accordion multiple defaultValue={["description"]} className="mt-10 max-w-sm border-t border-border">
            <AccordionItem value="description">
              <AccordionTrigger className="label-eyebrow text-foreground hover:no-underline">
                Description
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger className="label-eyebrow text-foreground hover:no-underline">
                Shipping &amp; returns
              </AccordionTrigger>
              <AccordionContent>
                <dl className="text-sm">
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd>{product.category?.name ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between py-2">
                    <dt className="text-muted-foreground">Shipping</dt>
                    <dd>Free over {formatVnd(1000000)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-sm text-muted-foreground">
                  See our{" "}
                  <Link href="/shipping-policy" className="underline underline-offset-4 hover:text-foreground">
                    shipping
                  </Link>{" "}
                  and{" "}
                  <Link href="/return-policy" className="underline underline-offset-4 hover:text-foreground">
                    return
                  </Link>{" "}
                  policies.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {together.length > 0 && (
        <section className="mx-auto hidden max-w-7xl px-5 pb-16 sm:px-8 lg:block">
          <h2 className="label-eyebrow mb-10 border-b border-border pb-5 text-foreground">
            Frequently bought together
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-4 sm:gap-x-6">
            {together.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mx-auto hidden max-w-7xl px-5 pb-24 sm:px-8 lg:block">
          <h2 className="label-eyebrow mb-10 border-b border-border pb-5 text-foreground">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-4 sm:gap-x-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
