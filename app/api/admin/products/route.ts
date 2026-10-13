import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { createProduct } from "@/lib/catalog/product-admin";
import { productInputSchema } from "@/lib/validation/product";

export const GET = withAuth(["STAFF", "ADMIN"], async () => {
  const products = await prisma.product.findMany({
    include: { variants: true, images: true },
    orderBy: { createdAt: "desc" },
  });
  return apiOk(products);
});

export const POST = withAuth(["STAFF", "ADMIN"], async (req, user) => {
  const input = productInputSchema.parse(await req.json());
  const product = await createProduct(input);
  await prisma.auditLog.create({
    data: { actorId: user.id, action: "PRODUCT_CREATE", entity: `Product:${product.id}`, after: input },
  });
  return apiOk(product, { status: 201 });
});
