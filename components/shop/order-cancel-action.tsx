"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/** Customer-facing cancel — only rendered for orders still at step 0
 * (PENDING_PAYMENT/PENDING_CONFIRM); the API re-checks that server-side via
 * `transitionOrder`'s own allowed-transitions table. */
export function OrderCancelAction({ orderId, onCancelled }: { orderId: string; onCancelled: () => void }) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Could not cancel order");
      toast.success("Order cancelled");
      onCancelled();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not cancel order");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={pending}>
            Cancel
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep order</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>Cancel order</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
