"use client";

import { useRouter } from "next/navigation";
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

/** Only statuses `transitionOrder` (lib/order/index.ts) actually allows a
 * cancel/refund transition from — matches ALLOWED_TRANSITIONS exactly. */
const ACTIONS: Record<string, { label: string; to: string } | undefined> = {
  PENDING_PAYMENT: { label: "Cancel", to: "CANCELLED" },
  PENDING_CONFIRM: { label: "Cancel", to: "CANCELLED" },
  PAID: { label: "Refund", to: "REFUNDED" },
};

export function OrderActions({ orderId, status, code }: { orderId: string; status: string; code: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const action = ACTIONS[status];
  if (!action) return null;

  async function confirm() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action!.to }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? `Could not ${action!.label.toLowerCase()} order`);
      toast.success(`${code} ${action!.label.toLowerCase()}ed`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={pending}>
            {action.label}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action.label} order {code}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Stock will be released back to inventory
            {action.to === "REFUNDED" ? " and the order marked refunded" : ""}. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Back</AlertDialogCancel>
          <AlertDialogAction onClick={confirm}>{action.label}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
