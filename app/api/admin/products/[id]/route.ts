import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { updateProduct } from "@/lib/catalog/product-admin";
import { productInputSchema } from "@/lib/validation/product";

export const PATCH = withAuth(["STAFF", "ADMIN"], async (req, user, ctx) => {
  const { id } = await ctx.params;
  const input = productInputSchema.parse(await req.json());

  const product = await updateProduct(id, input);
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "PRODUCT_UPDATE", entity: `Product:${id}`, after: input },
  });
  return apiOk(product);
});
