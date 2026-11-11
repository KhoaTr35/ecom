"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Share2, ShoppingBag } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGuestCart } from "@/components/shop/guest-cart-context";
import { FeedStoryMedia } from "@/components/shop/mobile/feed-story-media";
import { QuickAddSheet } from "@/components/shop/mobile/quick-add-sheet";
import { trackClient } from "@/lib/analytics/client";
import { formatVnd } from "@/lib/utils";
import { cn } from "cn";
import type { FeedProduct } from "@/lib/catalog/feed";

const DESCRIPTION_PREVIEW_LENGTH = 72;

async function share(title: string, url: string) {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // user cancelled the native share sheet — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(url);
  toast.success("Link copied");
}

/** One full-screen product slide of the Feed (design pages 01/03) — media,
 * right-hand action rail, caption, size chips and the inline add-to-bag CTA.
 * `priority` is passed by the scroller for whichever slide is active, so
 * only the visible image competes for the initial paint budget. */
export function FeedProductSlide({ product, priority }: { product: FeedProduct; priority?: boolean }) {
  const { addItem } = useGuestCart();
  const [selectedId, setSelectedId] = useState(
    () => product.variants.find((v) => v.stock > 0)?.id ?? product.variants[0]?.id ?? "",
  );
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const selected = product.variants.find((v) => v.id === selectedId);
  const soldOut = !selected || selected.stock === 0;
  const discounted = selected ? selected.unitFinal < selected.unitBase : false;
  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${product.slug}` : `/p/${product.slug}`;

  return (
    <section className="relative h-[100dvh] w-full flex-shrink-0 snap-start bg-feed text-feed-foreground">
      <FeedStoryMedia
        images={product.images}
        alt={product.name}
        priority={priority}
        className="absolute inset-0"
        progressClassName="top-[100px]"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/90 from-30% to-transparent" />

      <Link
        href="/wall"
        className="absolute left-0 top-[220px] z-10 flex items-center gap-1.5 rounded-r-full bg-white/15 py-3 pl-2.5 pr-3.5 text-xs font-semibold"
      >
        Wall
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12h16m-6-6 6 6-6 6" />
        </svg>
      </Link>

      <div className="absolute bottom-[158px] right-2.5 z-10 flex flex-col items-center gap-4">
        <RailAction href="/wall" label="Wall">
          <span className="flex size-[46px] items-center justify-center rounded-full border-2 border-white bg-foreground font-heading text-xl">
            A
          </span>
        </RailAction>
        <RailAction label="Add" onClick={() => setQuickAddOpen(true)}>
          <ShoppingBag className="size-[22px]" strokeWidth={1.8} />
        </RailAction>
        <RailAction href={`/p/${product.slug}`} label="Details">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v6M12 7.5v.5" />
          </svg>
        </RailAction>
        <RailAction label="Share" onClick={() => share(product.name, url)}>
          <Share2 className="size-[22px]" strokeWidth={1.8} />
        </RailAction>
      </div>

      <div className="absolute inset-x-4 bottom-24 z-10 flex flex-col gap-2.5">
        <div className="flex flex-col gap-2 pr-16">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
            {product.categoryName}
          </span>
          <h1 className="font-heading text-[32px] leading-[1.05]">{product.name}</h1>
          <p className="flex items-center gap-2 text-base">
            {formatVnd(selected?.unitFinal ?? 0)}
            {discounted && selected && (
              <>
                <span className="text-xs text-white/65 line-through">{formatVnd(selected.unitBase)}</span>
                {selected.appliedRule && (
                  <span className="rounded-full border border-white/60 px-2 py-0.5 text-[10px] font-semibold">
                    {selected.appliedRule}
                  </span>
                )}
              </>
            )}
          </p>
          {product.description && (
            <Link href={`/p/${product.slug}`} className="text-xs leading-relaxed text-white/80">
              {product.description.slice(0, DESCRIPTION_PREVIEW_LENGTH)}
              {product.description.length > DESCRIPTION_PREVIEW_LENGTH ? "… " : " "}
              <span className="font-semibold text-white">more</span>
            </Link>
          )}
        </div>

        {product.variants.length > 0 && (
          <ToggleGroup
            value={selectedId ? [selectedId] : []}
            onValueChange={(value) => {
              const next = value[0];
              if (next) setSelectedId(next);
            }}
            className="flex-wrap gap-1.5"
          >
            {product.variants.map((variant) => {
              const available = variant.stock > 0;
              const isSelected = variant.id === selectedId;
              return (
                <ToggleGroupItem
                  key={variant.id}
                  value={variant.id}
                  disabled={!available}
                  className={cn(
                    "min-w-11 rounded-lg border px-3 text-[13px] text-white disabled:line-through disabled:opacity-100",
                    !available && "border-white/40 bg-black/20 text-white/50",
                    available && isSelected && "border-white bg-white font-semibold text-foreground",
                    available && !isSelected && "border-white/40 bg-black/20",
                  )}
                >
                  {variant.label}
                </ToggleGroupItem>
              );
            })}
            {selected && selected.stock > 0 && selected.stock <= 5 && (
              <span className="ml-1 flex items-center text-[11px] text-white/75">Only {selected.stock} left</span>
            )}
          </ToggleGroup>
        )}

        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            if (!selected) return;
            addItem(selected.id, 1);
            trackClient("add_to_cart", { variantId: selected.id });
            toast.success(`Added ${selected.label} to bag`);
          }}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-white text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground disabled:opacity-60"
        >
          {soldOut ? "Sold out" : `Add to bag · ${selected?.label ?? ""}`}
        </button>
      </div>

      <QuickAddSheet product={product} open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </section>
  );
}

function RailAction({
  href,
  label,
  onClick,
  children,
}: {
  href?: string;
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const className = "flex min-h-11 flex-col items-center gap-1 text-[10px]";
  const icon = (
    <span className="flex size-[46px] items-center justify-center rounded-full bg-white/15">{children}</span>
  );

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {icon}
        {label}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={className}>
      {icon}
      {label}
    </button>
  );
}
