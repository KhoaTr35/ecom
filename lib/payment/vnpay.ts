import { prisma } from "@/lib/db";
import type { Order } from "@/lib/generated/prisma/client";
import type { PaymentProvider } from "@/lib/payment/types";
import { formatVnpayDate, signParams, verifyCallback } from "@/lib/payment/vnpay-signature";

/** VNPay IPN response codes (sandbox integration guide). */
export const IPN_RESPONSE = {
  SUCCESS: { RspCode: "00", Message: "Confirm Success" },
  ORDER_NOT_FOUND: { RspCode: "01", Message: "Order not found" },
  ALREADY_CONFIRMED: { RspCode: "02", Message: "Order already confirmed" },
  INVALID_AMOUNT: { RspCode: "04", Message: "Invalid amount" },
  INVALID_SIGNATURE: { RspCode: "97", Message: "Invalid signature" },
  UNKNOWN_ERROR: { RspCode: "99", Message: "Unknown error" },
} as const;

function requireSecret(): string {
  const secret = process.env.VNP_HASH_SECRET;
  if (!secret) throw new Error("VNP_HASH_SECRET is not configured");
  return secret;
}

export const vnpay: PaymentProvider = {
  async createPayment(order, ctx) {
    const secret = requireSecret();

    const params: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: process.env.VNP_TMN_CODE ?? "",
      vnp_Amount: String(order.total * 100),
      vnp_CurrCode: "VND",
      vnp_TxnRef: order.code,
      vnp_OrderInfo: `Thanh toan don hang ${order.code}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: process.env.VNP_RETURN_URL ?? "",
      vnp_IpAddr: ctx.ipAddr,
      vnp_CreateDate: formatVnpayDate(ctx.now),
      // Mirrors the 15-minute stock hold so the gateway expires with the order.
      ...(order.expiresAt ? { vnp_ExpireDate: formatVnpayDate(order.expiresAt) } : {}),
    };

    const query = new URLSearchParams(params);
    query.set("vnp_SecureHash", signParams(params, secret));

    return { redirectUrl: `${process.env.VNP_PAY_URL}?${query.toString()}` };
  },

  verifyCallback(params) {
    return verifyCallback(params, requireSecret());
  },
};

/**
 * Authoritative payment confirmation. Idempotent: a repeated IPN for an order
 * that is already paid reports "already confirmed" without double-crediting.
 */
export async function handleVnpayIpn(
  params: URLSearchParams,
): Promise<{ RspCode: string; Message: string }> {
  try {
    const callback = vnpay.verifyCallback!(params);
    if (!callback.valid) return IPN_RESPONSE.INVALID_SIGNATURE;

    const order = await prisma.order.findUnique({ where: { code: callback.txnRef } });
    if (!order) return IPN_RESPONSE.ORDER_NOT_FOUND;
    if (order.total !== callback.amount) return IPN_RESPONSE.INVALID_AMOUNT;

    // Only a still-pending order may be settled; this guard is what makes a
    // replayed IPN a no-op.
    if (order.status !== "PENDING_PAYMENT") return IPN_RESPONSE.ALREADY_CONFIRMED;

    await recordPayment(order, params, callback.success);
    return IPN_RESPONSE.SUCCESS;
  } catch (error) {
    console.error("VNPay IPN failed", error);
    return IPN_RESPONSE.UNKNOWN_ERROR;
  }
}

async function recordPayment(order: Order, params: URLSearchParams, success: boolean) {
  const rawPayload = Object.fromEntries(params.entries());

  await prisma.$transaction(async (tx) => {
    // Conditional update: if a concurrent IPN already moved the order on,
    // count is 0 and we leave stock and status untouched.
    const moved = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING_PAYMENT" },
      data: { status: success ? "PAID" : "CANCELLED", expiresAt: null },
    });
    if (moved.count === 0) return;

    // A failed payment releases the stock the order was holding.
    if (!success) {
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.qty } },
        });
      }
    }

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "VNPAY",
        txnRef: order.code,
        amount: order.total,
        status: success ? "SUCCESS" : "FAILED",
        rawPayload,
      },
    });
  });
}
