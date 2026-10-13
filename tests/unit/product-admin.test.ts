import { describe, expect, it } from "vitest";
import { diffVariantIds } from "@/lib/catalog/product-admin";

describe("diffVariantIds", () => {
  it("keeps variants still present in the incoming form", () => {
    expect(diffVariantIds(["a", "b"], [{ id: "a" }, { id: "b" }])).toEqual([]);
  });

  it("flags existing variants dropped from the form for deletion", () => {
    expect(diffVariantIds(["a", "b"], [{ id: "a" }])).toEqual(["b"]);
  });

  it("deletes an existing variant replaced by all-new rows", () => {
    expect(diffVariantIds(["a"], [{}, {}])).toEqual(["a"]);
  });

  it("deletes everything when the form has no variants left", () => {
    expect(diffVariantIds(["a", "b"], [])).toEqual(["a", "b"]);
  });
});
