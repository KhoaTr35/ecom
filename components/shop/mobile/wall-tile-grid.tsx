import Image from "next/image";
import Link from "next/link";
import { Copy } from "lucide-react";
import { formatVnd } from "@/lib/utils";
import type { ProductCardData } from "@/lib/catalog/product-pricing";

/** The Wall's 3-column gapless grid (design page 05) — price chip overlay,
 * sold-out badge, and a "multi-image" marker standing in for the design's
 * reel marker (decision 2: no video field, `imageCount > 1` is the honest
 * substitute). */
export function WallTileGrid({ products }: { products: ProductCardData[] }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {products.map((product) => (
        <Link key={product.id} href={`/p/${product.slug}`} className="relative block aspect-[3/4] bg-muted">
          {product.image && (
            <Image src={product.image.url} alt={product.image.alt} fill sizes="33vw" className="object-cover" />
          )}
          {product.imageCount > 1 && (
            <Copy className="absolute right-1.5 top-1.5 size-3.5 text-white drop-shadow" aria-label="Multiple images" />
          )}
          {!product.inStock && (
            <span className="absolute left-1.5 top-1.5 bg-background px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em]">
              Sold out
            </span>
          )}
          <span className="absolute bottom-1.5 left-1.5 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
            {formatVnd(product.fromPrice)}
          </span>
        </Link>
      ))}
    </div>
  );
}
