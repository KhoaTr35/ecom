import { Prisma, type Product } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { ProductInput } from "@/lib/validation/product";

/** Existing variant ids no longer present in the incoming form — safe to delete. */
export function diffVariantIds(existingIds: string[], incoming: { id?: string }[]): string[] {
  const keep = new Set(incoming.filter((v) => v.id).map((v) => v.id!));
  return existingIds.filter((id) => !keep.has(id));
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return prisma.product.create({
    data: {
      categoryId: input.categoryId,
      slug: input.slug,
      name: input.name,
      brand: input.brand,
      description: input.description,
      attributes: input.attributes,
      status: input.status,
      variants: {
        create: input.variants.map((v) => ({ sku: v.sku, options: v.options, basePrice: v.basePrice, stock: v.stock })),
      },
      images: { create: input.images.map((img, sortOrder) => ({ ...img, sortOrder })) },
    },
  });
}

/** Full replace of variants/images, matched by `id` where provided. A variant removed from
 * the form that's still referenced by an order or cart fails the FK check — reported as a
 * clear error instead of silently dropping it or wiping unrelated rows. */
export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const existing = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!existing) throw new AppError("NOT_FOUND", "Product not found");

  const removedVariantIds = diffVariantIds(existing.variants.map((v) => v.id), input.variants);

  try {
    return await prisma.$transaction(async (tx) => {
      if (removedVariantIds.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: removedVariantIds } } });
      }

      for (const v of input.variants) {
        if (v.id) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: { options: v.options, basePrice: v.basePrice, stock: v.stock },
          });
        } else {
          await tx.productVariant.create({
            data: { productId: id, sku: v.sku, options: v.options, basePrice: v.basePrice, stock: v.stock },
          });
        }
      }

      await tx.productImage.deleteMany({ where: { productId: id } });
      if (input.images.length > 0) {
        await tx.productImage.createMany({
          data: input.images.map((img, sortOrder) => ({ productId: id, ...img, sortOrder })),
        });
      }

      return tx.product.update({
        where: { id },
        data: {
          categoryId: input.categoryId,
          slug: input.slug,
          name: input.name,
          brand: input.brand,
          description: input.description,
          attributes: input.attributes,
          status: input.status,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new AppError("VALIDATION_ERROR", "Can't remove a variant that's already used in an existing order or cart");
    }
    throw error;
  }
}
