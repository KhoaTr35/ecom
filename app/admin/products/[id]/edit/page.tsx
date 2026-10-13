import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { listCategories } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    listCategories(),
    prisma.product.findUnique({ where: { id }, include: { variants: true, images: { orderBy: { sortOrder: "asc" } } } }),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">Edit product</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
