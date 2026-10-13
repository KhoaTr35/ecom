import { NextRequest } from "next/server";
import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { cartItemSchema } from "@/lib/validation/cart";
import { getCart, upsertCartItem, removeCartItem } from "@/lib/cart";

const ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;

export const GET = withAuth(ROLES, async (_req, user) => apiOk(await getCart(user.id)));

export const POST = withAuth(ROLES, async (req: NextRequest, user) => {
  const { variantId, qty } = cartItemSchema.parse(await req.json());
  return apiOk(await upsertCartItem(user.id, variantId, qty));
});

export const PATCH = POST;

export const DELETE = withAuth(ROLES, async (req: NextRequest, user) => {
  const { variantId } = cartItemSchema.pick({ variantId: true }).parse(await req.json());
  return apiOk(await removeCartItem(user.id, variantId));
});
