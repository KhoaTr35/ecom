import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { productStatusSchema } from "@/lib/validation/product";
import { prisma } from "@/lib/db";

export const PATCH = withAuth(["STAFF", "ADMIN"], async (req, user, ctx) => {
  const { id } = await ctx.params;
  const { status } = productStatusSchema.parse(await req.json());

  const product = await prisma.product.update({ where: { id }, data: { status } });
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "PRODUCT_STATUS", entity: `Product:${id}`, after: { status } },
  });

  return apiOk(product);
});
