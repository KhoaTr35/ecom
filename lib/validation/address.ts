import { z } from "zod";

export const createAddressSchema = z.object({
  recipient: z.string().min(1),
  phone: z.string().min(1),
  line: z.string().min(1),
  ward: z.string().min(1),
  province: z.string().min(1),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();
