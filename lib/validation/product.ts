import { z } from "zod";

export const productStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

const jsonObject = z.record(z.string(), z.any());

export const productVariantInputSchema = z.object({
  id: z.string().optional(), // present = update existing variant, absent = create new
  sku: z.string().min(1),
  options: jsonObject,
  basePrice: z.number().int().positive(),
  stock: z.number().int().min(0),
});

export const productImageInputSchema = z.object({
  url: z.string().min(1),
  alt: z.string().min(1),
});

export const productInputSchema = z.object({
  categoryId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().optional(),
  description: z.string().min(1),
  attributes: jsonObject,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  variants: z.array(productVariantInputSchema).min(1),
  images: z.array(productImageInputSchema),
});

export type ProductInput = z.infer<typeof productInputSchema>;
