/** Single source for storefront category navigation — used by the header
 *  (desktop row + mobile sheet) and the footer, so they can never drift apart. */
export const SHOP_LINKS = [
  { href: "/c/new-arrivals", label: "New Arrivals" },
  { href: "/c/ready-to-wear", label: "Ready-to-Wear" },
  { href: "/c/accessories", label: "Accessories" },
] as const;

export const INFO_LINKS = [
  { href: "/return-policy", label: "Returns" },
  { href: "/shipping-policy", label: "Shipping" },
  { href: "/payment-policy", label: "Payment" },
  { href: "/privacy", label: "Privacy" },
] as const;
