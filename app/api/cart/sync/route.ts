import { NextRequest } from "next/server";
import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { syncCartSchema } from "@/lib/validation/cart";
import { syncGuestCart } from "@/lib/cart";

export const POST = withAuth(["CUSTOMER", "STAFF", "ADMIN"], async (req: NextRequest, user) => {
  const { items } = syncCartSchema.parse(await req.json());
  return apiOk(await syncGuestCart(user.id, items));
});
