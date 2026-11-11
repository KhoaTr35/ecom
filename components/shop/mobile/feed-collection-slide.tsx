import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { formatVnd } from "@/lib/utils";
import type { FeedCollectionReel } from "@/lib/catalog/feed";

/** A category reel mixed into the Feed every few products (design page 02,
 * plan decision 1) — headline, subcopy and a real 3-product strip, no
 * pinned film hotspots. Server component: the strip is plain links, no
 * client state needed. */
export function FeedCollectionSlide({ reel }: { reel: FeedCollectionReel }) {
  return (
    <section className="relative h-[100dvh] w-full flex-shrink-0 snap-start bg-feed text-feed-foreground">
      {reel.heroMediaUrl ? (
        <Image src={reel.heroMediaUrl} alt={reel.name} fill sizes="100vw" className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-feed" />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[64%] bg-gradient-to-t from-black/92 from-40% to-transparent" />

      <div className="absolute inset-x-4 bottom-24 z-10 flex flex-col gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
          {reel.name} · Collection
        </span>
        <h1 className="font-heading text-[34px] leading-[1.05]">{reel.tagline ?? reel.name}</h1>

        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
            In this reel · {reel.products.length}
          </span>
          <Link href={`/c/${reel.slug}`} className="text-[11px] text-white/80">
            {reel.name} · {reel.totalCount} pieces
          </Link>
        </div>

        {reel.products.length > 0 && (
          <div className="flex gap-2">
            {reel.products.map((product) => (
              <Link
                key={product.id}
                href={`/p/${product.slug}`}
                className="flex flex-1 items-center gap-2 rounded-lg bg-white p-1.5 text-foreground"
              >
                <span className="relative h-11 w-9 flex-shrink-0 overflow-hidden rounded bg-muted">
                  {product.image && <Image src={product.image.url} alt={product.image.alt} fill className="object-cover" />}
                </span>
                <span className="text-[10px] leading-[1.35]">
                  {product.name}
                  <br />
                  <span className="text-muted-foreground">{formatVnd(product.fromPrice)}</span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link
            href={`/c/${reel.slug}`}
            className="flex h-12 flex-1 items-center justify-center rounded-lg bg-white text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground"
          >
            Shop the collection
          </Link>
          <Link
            href={`/?scope=new-in`}
            aria-label="Play the collection as a reel"
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/50"
          >
            <Play className="size-[18px]" fill="currentColor" />
          </Link>
        </div>
      </div>
    </section>
  );
}
