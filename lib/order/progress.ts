/** Forward-progress steps shared by both payment paths (VNPay adds a PAID
 * step COD skips — both land in PROCESSING next, so they share a step here).
 * CANCELLED/REFUNDED are terminal exits, not a point on this line — they
 * render as a plain status badge instead. Shared by the desktop orders page
 * and the mobile order card so both read one definition. */
export const ORDER_PROGRESS_STEPS = ["Placed", "Processing", "Shipped", "Delivered"] as const;

export function orderProgressStep(status: string): number | null {
  switch (status) {
    case "PENDING_PAYMENT":
    case "PENDING_CONFIRM":
      return 0;
    case "PAID":
    case "PROCESSING":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return null;
  }
}
