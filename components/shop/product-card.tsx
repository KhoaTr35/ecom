import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog/product-pricing";
import { formatVnd } from "@/lib/utils";

export function ProductCard({ product }: { product: ProductCardData }) {
  const discounted = product.fromPrice < product.fromBase;

  return (
    <Link href={`/p/${product.slug}`} className="group block">
      {/* Portrait ratio suits garments; no border or shadow — the image is the card. */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="label-eyebrow flex size-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {!product.inStock && (
          <span className="label-eyebrow absolute left-3 top-3 bg-background px-2 py-1 text-foreground">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3.5 space-y-1">
        <p className="text-sm leading-snug text-foreground">{product.name}</p>
        {/* Price stays visible when sold out — the badge already signals availability. */}
        <p className="flex items-baseline gap-2 text-sm text-muted-foreground">
          <span className={discounted ? "text-foreground" : undefined}>
            {formatVnd(product.fromPrice)}
          </span>
          {discounted && <span className="line-through">{formatVnd(product.fromBase)}</span>}
        </p>
      </div>
    </Link>
  );
}
