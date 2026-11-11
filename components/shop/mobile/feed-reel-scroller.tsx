"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "cn";
import { trackClient } from "@/lib/analytics/client";
import { FeedProductSlide } from "@/components/shop/mobile/feed-product-slide";
import { FeedCollectionSlide } from "@/components/shop/mobile/feed-collection-slide";
import type { FeedItem, FeedScope } from "@/lib/catalog/feed";

const SCOPES: { value: FeedScope; label: string }[] = [
  { value: "for-you", label: "For you" },
  { value: "new-in", label: "New in" },
  { value: "sale", label: "Sale" },
];

const SWIPE_THRESHOLD_PX = 60;

/** The Feed's scroll-snap container (design pages 01/02) — one product or
 * collection per screen, swipe up/down to page, swipe right to the Wall.
 * CSS scroll-snap + a touch handler, no carousel library (plan: "No embla,
 * no framer-motion, no vaul"). `fixed inset-0` so it ignores the shared
 * `<main>` padding meant for normal-flow mobile screens. */
export function FeedReelScroller({ items, scope }: { items: FeedItem[]; scope: FeedScope }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const slides = Array.from(container.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (!visible) return;
        const index = slides.indexOf(visible.target as HTMLElement);
        if (index >= 0) setActiveIndex(index);
      },
      { root: container, threshold: 0.6 },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    const active = items[activeIndex];
    if (active?.kind === "product") trackClient("product_view", { path: `/p/${active.product.slug}` });
  }, [activeIndex, items]);

  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (dx > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) router.push("/wall");
  }

  return (
    <div className="fixed inset-0 z-0 lg:hidden">
      <div
        ref={containerRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
      >
        {items.map((item, i) =>
          item.kind === "product" ? (
            <FeedProductSlide key={item.product.id} product={item.product} priority={i === activeIndex} />
          ) : (
            <FeedCollectionSlide key={`reel-${item.reel.slug}-${i}`} reel={item.reel} />
          ),
        )}
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-11 z-20 flex h-12 items-center justify-between px-4 text-white">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">Atelier</span>
        <nav aria-label="Feed" className="flex gap-5 text-sm">
          {SCOPES.map((s) => (
            <Link
              key={s.value}
              href={s.value === "for-you" ? "/" : `/?scope=${s.value}`}
              aria-current={s.value === scope ? "page" : undefined}
              className={cn(
                "pointer-events-auto border-b-2 py-3",
                s.value === scope ? "border-white font-semibold" : "border-transparent text-white/70",
              )}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <Link href="/search" aria-label="Search" className="pointer-events-auto flex size-10 items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </Link>
      </header>
    </div>
  );
}
