import { z } from "zod";
import { EVENT_TYPES } from "@/lib/analytics";

export const trackEventSchema = z.object({
  type: z.enum(EVENT_TYPES),
  payload: z.record(z.string(), z.any()).optional(),
});
