import { z } from "zod";

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  qty: z.number().int().positive(),
});

export const quoteCartSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  shippingMethodCode: z.string().optional(),
});

export const syncCartSchema = z.object({
  items: z.array(cartItemSchema),
});
