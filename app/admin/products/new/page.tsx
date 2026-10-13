import { listCategories } from "@/lib/catalog";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await listCategories();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
