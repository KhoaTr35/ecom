import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { orderStatusSchema } from "@/lib/validation/order";
import { transitionOrder } from "@/lib/order";

export const PATCH = withAuth(["STAFF", "ADMIN"], async (req, user, ctx) => {
  const { id } = await ctx.params;
  const { status } = orderStatusSchema.parse(await req.json());
  const order = await transitionOrder(id, status, user.id);
  return apiOk(order);
});
