import type { Order } from "@/lib/generated/prisma/client";
import type { VnpayCallback } from "@/lib/payment/vnpay-signature";

export interface PaymentProvider {
  createPayment(order: Order, ctx: { ipAddr: string; now: Date }): Promise<{ redirectUrl?: string }>;
  /** Gateway-backed providers only; COD has no callback. */
  verifyCallback?(params: URLSearchParams): VnpayCallback;
}
