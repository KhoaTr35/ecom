import { z } from "zod";

export const placeOrderSchema = z.object({
  addressId: z.string().min(1).nullable(),
  shippingMethodCode: z.string().min(1),
  paymentMethod: z.enum(["VNPAY", "COD"]),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "PENDING_CONFIRM",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
});
