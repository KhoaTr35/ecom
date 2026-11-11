"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Share2, ShoppingBag } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/shop/product-card";
import { ProductPurchasePanel } from "@/components/shop/product-purchase-panel";
import { useGuestCart } from "@/components/shop/guest-cart-context";
import { FeedStoryMedia } from "@/components/shop/mobile/feed-story-media";
import { MobileStickyActionBar } from "@/components/shop/mobile/mobile-sticky-action-bar";
import { trackClient } from "@/lib/analytics/client";
import { formatVnd } from "@/lib/utils";
import type { PricedVariant } from "@/lib/catalog/product-pricing";
import type { ProductCardData } from "@/lib/catalog/product-pricing";

type Product = {
  slug: string;
  name: string;
  description: string;
  category: { slug: string; name: string } | null;
  images: { url: string; alt: string }[];
};

/** Mobile product page (design page 04) — story-style gallery, the usual
 * size grid (`ProductPurchasePanel`, shared with desktop), and a sticky add
 * bar that mirrors whichever size is selected above. */
export function MobileProductDetail({
  product,
  variants,
  axisLabel,
  together,
  related,
}: {
  product: Product;
  variants: PricedVariant[];
  axisLabel: string;
  together: ProductCardData[];
  related: ProductCardData[];
}) {
  const { addItem, count } = useGuestCart();
  const [selectedId, setSelectedId] = useState(
    () => variants.find((v) => v.stock > 0)?.id ?? variants[0]?.id ?? "",
  );
  const selected = variants.find((v) => v.id === selectedId);
  const soldOut = !selected || selected.stock === 0;

  return (
    <div className="lg:hidden">
      <div className="relative h-[62vh] max-h-[460px]">
        <FeedStoryMedia images={product.images} alt={product.name} priority className="absolute inset-0" />
        <div className="absolute inset-x-2 top-16 flex justify-between">
          <Link href="/" aria-label="Back to the feed" className="flex size-11 items-center justify-center rounded-full bg-black/35 text-white">
            <ChevronLeft className="size-5" strokeWidth={2} />
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Share"
              onClick={async () => {
                const url = `${window.location.origin}/p/${product.slug}`;
                if (navigator.share) {
                  try {
                    await navigator.share({ title: product.name, url });
                    return;
                  } catch {
                    // fall through to clipboard
                  }
                }
                await navigator.clipboard.writeText(url);
                toast.success("Link copied");
              }}
              className="flex size-11 items-center justify-center rounded-full bg-black/35 text-white"
            >
              <Share2 className="size-5" strokeWidth={1.8} />
            </button>
            <Link
              href="/cart"
              aria-label={`Bag, ${count} items`}
              className="relative flex size-11 items-center justify-center rounded-full bg-black/35 text-white"
            >
              <ShoppingBag className="size-5" strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="relative -mt-5 flex flex-col gap-6 rounded-t-3xl bg-background px-5 pb-32 pt-2.5">
        <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-border" />

        <div>
          {product.category && (
            <Link href={`/c/${product.category.slug}`} className="label-eyebrow text-muted-foreground">
              {product.category.name} ›
            </Link>
          )}
          <h1 className="mt-2 font-heading text-[30px] leading-tight">{product.name}</h1>
        </div>

        <ProductPurchasePanel
          variants={variants}
          axisLabel={axisLabel}
          selectedId={selectedId}
          onSelectedIdChange={setSelectedId}
        />

        <Accordion multiple defaultValue={["description"]} className="border-t border-border">
          <AccordionItem value="description">
            <AccordionTrigger className="label-eyebrow text-foreground hover:no-underline">Description</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="shipping">
            <AccordionTrigger className="label-eyebrow text-foreground hover:no-underline">
              Shipping &amp; returns
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">
                See the{" "}
                <Link href="/shipping-policy" className="underline underline-offset-4">
                  shipping
                </Link>{" "}
                and{" "}
                <Link href="/return-policy" className="underline underline-offset-4">
                  return
                </Link>{" "}
                policies.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {together.length > 0 && (
          <RelatedRail title="Frequently bought together" products={together} />
        )}
        {related.length > 0 && <RelatedRail title="More like this" products={related} />}
      </div>

      <MobileStickyActionBar>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">{selected?.label ?? "—"}</span>
          <span className="text-[15px] font-semibold">{formatVnd(selected?.unitFinal ?? 0)}</span>
        </div>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            if (!selected) return;
            addItem(selected.id, 1);
            trackClient("add_to_cart", { variantId: selected.id });
            toast.success(`Added ${selected.label} to bag`);
          }}
          className="h-[50px] flex-1 rounded-md bg-foreground text-[12px] font-semibold uppercase tracking-[0.1em] text-background disabled:opacity-60"
        >
          {soldOut ? "Sold out" : "Add to bag"}
        </button>
      </MobileStickyActionBar>
    </div>
  );
}

function RelatedRail({ title, products }: { title: string; products: ProductCardData[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="label-eyebrow text-foreground">{title}</h2>
      <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5">
        {products.map((product) => (
          <div key={product.id} className="w-32 shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
