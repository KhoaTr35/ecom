import { describe, expect, it } from "vitest";
import { rankCoPurchasedProducts } from "@/lib/recommend";

describe("rankCoPurchasedProducts", () => {
  it("ranks by co-occurrence frequency, most-frequent first", () => {
    const siblings = ["b", "c", "b", "a", "b", "c"];
    expect(rankCoPurchasedProducts(siblings, "x", 3)).toEqual(["b", "c", "a"]);
  });

  it("excludes the product being viewed from its own co-occurrence list", () => {
    const siblings = ["a", "a", "a", "b"];
    expect(rankCoPurchasedProducts(siblings, "a", 3)).toEqual(["b"]);
  });

  it("respects the limit", () => {
    const siblings = ["a", "b", "c", "d"];
    expect(rankCoPurchasedProducts(siblings, "x", 2)).toHaveLength(2);
  });

  it("returns nothing for a product with no co-purchase history", () => {
    expect(rankCoPurchasedProducts([], "x", 4)).toEqual([]);
  });
});
