import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { transitionOrder } from "@/lib/order";

export const POST = withAuth("ANY", async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== user.id) throw new AppError("NOT_FOUND", "Order not found");

  // `transitionOrder` enforces the allowed-transitions table itself (only
  // PENDING_PAYMENT/PENDING_CONFIRM -> CANCELLED), restocks variants, and
  // writes the audit log — same path the admin cancel action uses.
  const updated = await transitionOrder(id, "CANCELLED", user.id);
  return apiOk(updated);
});
