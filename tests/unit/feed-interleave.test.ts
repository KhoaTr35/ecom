import { describe, expect, it } from "vitest";
import { interleaveFeed, type FeedCollectionReel, type FeedProduct } from "@/lib/catalog/feed";

function makeProduct(id: string): FeedProduct {
  return { id, slug: id, categoryName: "Test", name: id, description: "", images: [], variants: [] };
}

function makeReel(slug: string): FeedCollectionReel {
  return { slug, name: slug, tagline: "t", heroMediaUrl: null, totalCount: 1, products: [] };
}

describe("interleaveFeed", () => {
  it("inserts a reel every 4th slot by default", () => {
    const products = Array.from({ length: 9 }, (_, i) => makeProduct(`p${i}`));
    const reels = [makeReel("r1")];
    const items = interleaveFeed(products, reels);

    expect(items.map((item) => item.kind)).toEqual([
      "product",
      "product",
      "product",
      "product",
      "collection",
      "product",
      "product",
      "product",
      "product",
      "collection",
      "product",
    ]);
  });

  it("cycles through reels in order when there are more slots than reels", () => {
    const products = Array.from({ length: 8 }, (_, i) => makeProduct(`p${i}`));
    const reels = [makeReel("r1"), makeReel("r2")];
    const items = interleaveFeed(products, reels);
    const collectionSlugs = items
      .filter((item) => item.kind === "collection")
      .map((item) => (item as { kind: "collection"; reel: FeedCollectionReel }).reel.slug);

    expect(collectionSlugs).toEqual(["r1", "r2"]);
  });

  it("degrades to products-only when there are no reels", () => {
    const products = [makeProduct("p0"), makeProduct("p1")];
    const items = interleaveFeed(products, []);

    expect(items).toEqual([
      { kind: "product", product: products[0] },
      { kind: "product", product: products[1] },
    ]);
  });

  it("returns nothing for an empty product list regardless of reels", () => {
    expect(interleaveFeed([], [makeReel("r1")])).toEqual([]);
  });

  it("never emits a trailing reel without a 4th product to anchor it", () => {
    const products = Array.from({ length: 3 }, (_, i) => makeProduct(`p${i}`));
    const items = interleaveFeed(products, [makeReel("r1")]);

    expect(items).toHaveLength(3);
    expect(items.every((item) => item.kind === "product")).toBe(true);
  });
});
