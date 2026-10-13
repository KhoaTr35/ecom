"use client";

import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export type ImageRow = { url: string; alt: string };

export function ProductImageRows({
  images,
  setImages,
}: {
  images: ImageRow[];
  setImages: React.Dispatch<React.SetStateAction<ImageRow[]>>;
}) {
  function update(index: number, patch: Partial<ImageRow>) {
    setImages((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  return (
    <FieldSet>
      <FieldLegend>Images</FieldLegend>
      {images.map((img, i) => (
        <div key={i} className="grid grid-cols-[2fr_1fr_auto] gap-2">
          <Input placeholder="Image URL" value={img.url} onChange={(e) => update(i, { url: e.target.value })} />
          <Input placeholder="Alt text" value={img.alt} onChange={(e) => update(i, { alt: e.target.value })} />
          <Button type="button" variant="outline" size="sm" onClick={() => setImages((rows) => rows.filter((_, idx) => idx !== i))}>
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setImages((rows) => [...rows, { url: "", alt: "" }])}>
        Add image
      </Button>
    </FieldSet>
  );
}
