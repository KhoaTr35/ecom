import { describe, expect, it } from "vitest";
import { calculatePrice } from "@/lib/pricing";
import type { PriceContext, PriceRuleLike, Segment } from "@/lib/pricing";

const VARIANT_ID = "variant-1";
const CATEGORY_ID = "category-1";

function makeRule(overrides: Partial<PriceRuleLike> = {}): PriceRuleLike {
  return {
    id: "rule-1",
    name: "Rule 1",
    type: "SEGMENT",
    condition: { segment: "NEW" },
    percentOff: 10,
    priority: 0,
    active: true,
    ...overrides,
  };
}

function makeContext(rules: PriceRuleLike[], variant?: Partial<{ basePrice: number; stock: number }>): PriceContext {
  return {
    variants: new Map([
      [
        VARIANT_ID,
        {
          basePrice: variant?.basePrice ?? 100_000,
          stock: variant?.stock ?? 10,
          categoryId: CATEGORY_ID,
          name: "Test piece",
        },
      ],
    ]),
    rules,
    shippingMethods: [
      { code: "STANDARD", fee: 30_000, freeFrom: 1_000_000 },
      { code: "EXPRESS", fee: 50_000, freeFrom: null },
    ],
  };
}

function quote(rules: PriceRuleLike[], opts: { now?: Date; segment?: Segment; qty?: number; shippingMethodCode?: string; basePrice?: number; stock?: number } = {}) {
  return calculatePrice(
    {
      items: [{ variantId: VARIANT_ID, qty: opts.qty ?? 1 }],
      segment: opts.segment ?? "GUEST",
      shippingMethodCode: opts.shippingMethodCode,
      now: opts.now ?? new Date("2026-03-09T03:00:00Z"), // 10:00 Vietnam — outside every window used below
    },
    makeContext(rules, { basePrice: opts.basePrice, stock: opts.stock }),
  );
}

describe("SEGMENT rule", () => {
  const rule = makeRule({ type: "SEGMENT", condition: { segment: "NEW" }, percentOff: 10 });

  it("applies to the matching segment", () => {
    const result = quote([rule], { segment: "NEW" });
    expect(result.lines[0].unitFinal).toBe(90_000);
    expect(result.lines[0].appliedRule).toBe("Rule 1");
  });

  it("does not apply to a different segment", () => {
    const result = quote([rule], { segment: "RETURNING" });
    expect(result.lines[0].unitFinal).toBe(100_000);
    expect(result.lines[0].appliedRule).toBeUndefined();
  });
});

describe("STOCK_LEVEL rule", () => {
  const rule = makeRule({ type: "STOCK_LEVEL", condition: { minStock: 30 }, percentOff: 20 });

  it("applies when stock reaches the threshold", () => {
    expect(quote([rule], { stock: 30 }).lines[0].unitFinal).toBe(80_000);
  });

  it("does not apply below the threshold", () => {
    expect(quote([rule], { stock: 29 }).lines[0].unitFinal).toBe(100_000);
  });

  it("respects a categoryIds restriction", () => {
    const scoped = makeRule({
      type: "STOCK_LEVEL",
      condition: { minStock: 1, categoryIds: ["other-category"] },
      percentOff: 20,
    });
    expect(quote([scoped], { stock: 50 }).lines[0].unitFinal).toBe(100_000);
  });
});

describe("TIME_WINDOW rule (Asia/Ho_Chi_Minh)", () => {
  const rule = makeRule({ type: "TIME_WINDOW", condition: { start: "20:00", end: "22:00" }, percentOff: 10 });

  it("applies inside the window in Vietnam local time", () => {
    // 14:00Z is 21:00 in Vietnam (UTC+7) — a naive UTC comparison would miss this.
    expect(quote([rule], { now: new Date("2026-03-09T14:00:00Z") }).lines[0].unitFinal).toBe(90_000);
  });

  it("does not apply before the window starts", () => {
    // 11:00Z is 18:00 in Vietnam.
    expect(quote([rule], { now: new Date("2026-03-09T11:00:00Z") }).lines[0].unitFinal).toBe(100_000);
  });

  it("does not apply after the window ends", () => {
    // 16:00Z is 23:00 in Vietnam.
    expect(quote([rule], { now: new Date("2026-03-09T16:00:00Z") }).lines[0].unitFinal).toBe(100_000);
  });

  it("supports a window that wraps past midnight", () => {
    const overnight = makeRule({ type: "TIME_WINDOW", condition: { start: "22:00", end: "02:00" }, percentOff: 10 });
    // 18:00Z is 01:00 the next day in Vietnam.
    expect(quote([overnight], { now: new Date("2026-03-09T18:00:00Z") }).lines[0].unitFinal).toBe(90_000);
  });

  it("honours a daysOfWeek restriction", () => {
    // 2026-03-09T14:00Z is a Monday (1) in Vietnam.
    const monday = makeRule({ type: "TIME_WINDOW", condition: { start: "20:00", end: "22:00", daysOfWeek: [1] }, percentOff: 10 });
    const sunday = makeRule({ type: "TIME_WINDOW", condition: { start: "20:00", end: "22:00", daysOfWeek: [0] }, percentOff: 10 });
    const now = new Date("2026-03-09T14:00:00Z");

    expect(quote([monday], { now }).lines[0].unitFinal).toBe(90_000);
    expect(quote([sunday], { now }).lines[0].unitFinal).toBe(100_000);
  });
});

describe("rule combination", () => {
  it("applies only the largest discount, never the sum", () => {
    const small = makeRule({ id: "a", name: "Small", condition: { segment: "NEW" }, percentOff: 10 });
    const large = makeRule({ id: "b", name: "Large", condition: { segment: "NEW" }, percentOff: 25 });

    const result = quote([small, large], { segment: "NEW" });
    expect(result.lines[0].unitFinal).toBe(75_000); // not 65_000
    expect(result.lines[0].appliedRule).toBe("Large");
  });

  it("breaks a tie on priority", () => {
    const low = makeRule({ id: "a", name: "Low", condition: { segment: "NEW" }, percentOff: 10, priority: 1 });
    const high = makeRule({ id: "b", name: "High", condition: { segment: "NEW" }, percentOff: 10, priority: 5 });

    expect(quote([low, high], { segment: "NEW" }).lines[0].appliedRule).toBe("High");
  });

  it("ignores inactive rules", () => {
    const inactive = makeRule({ condition: { segment: "NEW" }, percentOff: 30, active: false });
    expect(quote([inactive], { segment: "NEW" }).lines[0].unitFinal).toBe(100_000);
  });
});

describe("discount limits", () => {
  it("caps the discount at 50%", () => {
    const greedy = makeRule({ condition: { segment: "NEW" }, percentOff: 80 });
    // 100_000 -> 50% -> 50_000, not 20_000.
    expect(quote([greedy], { segment: "NEW" }).lines[0].unitFinal).toBe(50_000);
  });

  it("rounds a discounted price down to the nearest 1.000d", () => {
    const rule = makeRule({ condition: { segment: "NEW" }, percentOff: 15 });
    // 45_000 * 0.85 = 38_250 -> 38_000
    expect(quote([rule], { segment: "NEW", basePrice: 45_000 }).lines[0].unitFinal).toBe(38_000);
  });

  it("leaves an undiscounted price exact", () => {
    expect(quote([], { basePrice: 45_500 }).lines[0].unitFinal).toBe(45_500);
  });
});

describe("totals and shipping", () => {
  it("reports subtotal, discount and total consistently", () => {
    const rule = makeRule({ condition: { segment: "NEW" }, percentOff: 10 });
    const result = quote([rule], { segment: "NEW", qty: 3 });

    expect(result.lines[0].lineTotal).toBe(270_000);
    expect(result.subtotal).toBe(270_000);
    expect(result.discount).toBe(30_000);
    expect(result.total).toBe(result.subtotal + result.shippingFee);
  });

  it("charges the shipping fee below freeFrom", () => {
    expect(quote([], { shippingMethodCode: "STANDARD", qty: 1 }).shippingFee).toBe(30_000);
  });

  it("waives the shipping fee once subtotal reaches freeFrom", () => {
    // 10 x 100.000 = 1.000.000, exactly the freeFrom threshold.
    expect(quote([], { shippingMethodCode: "STANDARD", qty: 10 }).shippingFee).toBe(0);
  });

  it("never waives a method without a freeFrom threshold", () => {
    expect(quote([], { shippingMethodCode: "EXPRESS", qty: 10 }).shippingFee).toBe(50_000);
  });

  it("charges nothing when no shipping method is chosen", () => {
    expect(quote([]).shippingFee).toBe(0);
  });
});
