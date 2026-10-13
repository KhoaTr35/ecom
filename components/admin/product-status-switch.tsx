"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

/** Toggles a product between ACTIVE and INACTIVE via the admin status endpoint. */
export function ProductStatusSwitch({
  productId,
  initialActive,
}: {
  productId: string;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [pending, setPending] = useState(false);

  async function onCheckedChange(checked: boolean) {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: checked ? "ACTIVE" : "INACTIVE" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not update product status");
      setActive(checked);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update product status");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-xs text-muted-foreground">{active ? "Active" : "Inactive"}</span>
      <Switch checked={active} onCheckedChange={onCheckedChange} disabled={pending} aria-label="Product active" />
    </div>
  );
}
