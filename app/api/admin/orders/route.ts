import { NextRequest } from "next/server";
import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";

export const GET = withAuth(["STAFF", "ADMIN"], async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get("status");
  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return apiOk(orders);
});
