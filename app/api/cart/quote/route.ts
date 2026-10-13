import { NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/http";
import { quoteCartSchema } from "@/lib/validation/cart";
import { quoteGuestCart } from "@/lib/cart";

// TODO: rate-limit this route (plan section 8.1) once a shared limiter exists.
export async function POST(req: NextRequest) {
  try {
    const { items } = quoteCartSchema.parse(await req.json());
    return apiOk(await quoteGuestCart(items, new Date()));
  } catch (error) {
    return apiError(error);
  }
}
