"use client";

import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type VariantRow = { id?: string; sku: string; optionsJson: string; basePrice: string; stock: string };

export const EMPTY_VARIANT: VariantRow = { sku: "", optionsJson: "{}", basePrice: "", stock: "" };

export function toVariantRows(variants: { id: string; sku: string; options: unknown; basePrice: number; stock: number }[] | undefined): VariantRow[] {
  if (!variants || variants.length === 0) return [EMPTY_VARIANT];
  return variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    optionsJson: JSON.stringify(v.options),
    basePrice: String(v.basePrice),
    stock: String(v.stock),
  }));
}

export function ProductVariantRows({
  variants,
  setVariants,
}: {
  variants: VariantRow[];
  setVariants: React.Dispatch<React.SetStateAction<VariantRow[]>>;
}) {
  function update(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  return (
    <FieldSet>
      <FieldLegend>Variants</FieldLegend>
      {variants.map((v, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_120px_100px_auto] gap-2">
          <Input placeholder="SKU" value={v.sku} onChange={(e) => update(i, { sku: e.target.value })} />
          <Input
            placeholder='Options JSON, e.g. {"size":"M"}'
            className="font-mono text-xs"
            value={v.optionsJson}
            onChange={(e) => update(i, { optionsJson: e.target.value })}
          />
          <Input type="number" placeholder="Price VND" value={v.basePrice} onChange={(e) => update(i, { basePrice: e.target.value })} />
          <Input type="number" placeholder="Stock" value={v.stock} onChange={(e) => update(i, { stock: e.target.value })} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={variants.length === 1}
            onClick={() => setVariants((rows) => rows.filter((_, idx) => idx !== i))}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setVariants((rows) => [...rows, { ...EMPTY_VARIANT }])}>
        Add variant
      </Button>
    </FieldSet>
  );
}
