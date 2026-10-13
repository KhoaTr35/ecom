import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";

export const GET = withAuth(["CUSTOMER", "STAFF", "ADMIN"], async (_req, user) => {
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return apiOk(orders);
});
