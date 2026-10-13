/** Public pricing contract (plan section 5.1). Shared by client and server. */

export type Segment = "GUEST" | "NEW" | "RETURNING";

export type PriceInput = {
  items: { variantId: string; qty: number }[];
  segment: Segment;
  shippingMethodCode?: string;
  now: Date;
};

export type PriceRuleLike = {
  id: string;
  name: string;
  type: "TIME_WINDOW" | "STOCK_LEVEL" | "SEGMENT";
  condition: unknown;
  percentOff: number;
  priority: number;
  active: boolean;
};

export type PriceContext = {
  variants: Map<string, { basePrice: number; stock: number; categoryId: string; name: string }>;
  rules: PriceRuleLike[];
  shippingMethods: { code: string; fee: number; freeFrom: number | null }[];
};

export type PriceLine = {
  variantId: string;
  qty: number;
  unitBase: number;
  unitFinal: number;
  /** Rule name, kept in the order's pricingSnapshot for KPI reporting. */
  appliedRule?: string;
  lineTotal: number;
  /** Display-only convenience, not part of the original contract. */
  name?: string;
};

export type PriceQuote = {
  lines: PriceLine[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
};
