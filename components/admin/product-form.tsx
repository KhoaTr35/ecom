"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { type ImageRow, ProductImageRows } from "@/components/admin/product-image-rows";
import { ProductVariantRows, toVariantRows, type VariantRow } from "@/components/admin/product-variant-rows";

type ProductFormProduct = {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string;
  attributes: unknown;
  status: string;
  variants: { id: string; sku: string; options: unknown; basePrice: number; stock: number }[];
  images: { url: string; alt: string }[];
};

/** Create/edit form for `/admin/products`. Variant `options` and top-level `attributes` are
 * raw JSON textareas rather than per-category dynamic fields — this storefront's category
 * filter axes vary per category (`Category.filters`), and building a dynamic schema-driven
 * input for that is more machinery than a course-project admin form needs; add it if typing
 * JSON becomes the actual bottleneck for whoever runs this panel. Active/inactive stays owned
 * by the status switch on the list page — this form resends the product's current status
 * unchanged so editing never silently reactivates a disabled product. */
export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormProduct;
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [attributesJson, setAttributesJson] = useState(JSON.stringify(product?.attributes ?? {}, null, 2));
  const [variants, setVariants] = useState<VariantRow[]>(() => toVariantRows(product?.variants));
  const [images, setImages] = useState<ImageRow[]>(product?.images ?? []);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    let attributes: Record<string, unknown>;
    try {
      attributes = JSON.parse(attributesJson || "{}");
    } catch {
      toast.error("Attributes must be valid JSON");
      return;
    }

    const parsedVariants: { id?: string; sku: string; options: Record<string, unknown>; basePrice: number; stock: number }[] = [];
    for (const v of variants) {
      if (!v.sku.trim()) return toast.error("Every variant needs a SKU");
      let options: Record<string, unknown>;
      try {
        options = JSON.parse(v.optionsJson || "{}");
      } catch {
        return toast.error(`Variant ${v.sku}: options must be valid JSON`);
      }
      const basePrice = Number(v.basePrice);
      const stock = Number(v.stock);
      if (!Number.isInteger(basePrice) || basePrice <= 0) return toast.error(`Variant ${v.sku}: price must be a positive whole number`);
      if (!Number.isInteger(stock) || stock < 0) return toast.error(`Variant ${v.sku}: stock must be 0 or more`);
      parsedVariants.push({ id: v.id, sku: v.sku.trim(), options, basePrice, stock });
    }

    const payload = {
      categoryId,
      slug: slug.trim(),
      name: name.trim(),
      brand: brand.trim() || undefined,
      description: description.trim(),
      attributes,
      status: product?.status ?? "ACTIVE",
      variants: parsedVariants,
      images: images.filter((img) => img.url.trim() && img.alt.trim()).map((img) => ({ url: img.url.trim(), alt: img.alt.trim() })),
    };

    setSubmitting(true);
    try {
      const res = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not save product");
      toast.success(product ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="product-name">Name</FieldLabel>
          <Input id="product-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="product-slug">Slug</FieldLabel>
          <Input id="product-slug" required value={slug} onChange={(e) => setSlug(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel>Category</FieldLabel>
          <Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}>
            <SelectTrigger aria-label="Category">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="product-brand">Brand</FieldLabel>
          <Input id="product-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="product-description">Description</FieldLabel>
          <Textarea id="product-description" required value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="product-attributes">Attributes (JSON)</FieldLabel>
          <Textarea
            id="product-attributes"
            value={attributesJson}
            onChange={(e) => setAttributesJson(e.target.value)}
            className="font-mono text-xs"
          />
          <FieldDescription>Free-form, e.g. {`{"material": "wool"}`}</FieldDescription>
        </Field>

        <ProductVariantRows variants={variants} setVariants={setVariants} />
        <ProductImageRows images={images} setImages={setImages} />
      </FieldGroup>

      <div className="mt-6 flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting && <Spinner data-icon="inline-start" />}
          {product ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
