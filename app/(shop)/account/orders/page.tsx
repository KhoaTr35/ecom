"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderCancelAction } from "@/components/shop/order-cancel-action";
import { formatVnd } from "@/lib/utils";

type OrderRow = { id: string; code: string; status: string; total: number; createdAt: string };

/** Forward-progress steps shared by both payment paths (VNPay adds a PAID
 * step COD skips — both land in PROCESSING next, so they share a step here).
 * CANCELLED/REFUNDED are terminal exits, not a point on this line — they
 * render as a plain status badge instead. */
const ORDER_PROGRESS_STEPS = ["Placed", "Processing", "Shipped", "Delivered"] as const;

function orderProgressStep(status: string): number | null {
  switch (status) {
    case "PENDING_PAYMENT":
    case "PENDING_CONFIRM":
      return 0;
    case "PAID":
    case "PROCESSING":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return null;
  }
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login?callbackUrl=/account/orders");
  }, [isPending, session, router]);

  function refreshOrders() {
    return fetch("/api/me/orders")
      .then((res) => res.json())
      .then((json) => setOrders(json.data ?? []))
      .finally(() => setOrdersLoading(false));
  }

  useEffect(() => {
    if (!session) return;
    refreshOrders();
  }, [session]);

  // "no orders yet" and "not fetched yet" both start as an empty array —
  // only show the empty state once loading has actually finished.
  const loading = isPending || !session || ordersLoading;

  return (
    <>
      <h1 className="font-heading text-5xl leading-tight">Orders</h1>

      {loading ? (
        <div className="mt-12 divide-y divide-border border-y border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-12 border border-dashed border-border p-8 text-sm text-muted-foreground">
          You don&apos;t have any orders yet.
        </p>
      ) : (
        <div className="mt-12 divide-y divide-border border-y border-border">
          {orders.map((o) => {
            const step = orderProgressStep(o.status);
            return (
              <div key={o.id} className="flex items-center justify-between gap-6 py-5">
                <div>
                  <p className="font-mono text-sm">{o.code}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatVnd(o.total)}</p>
                </div>
                {step === null ? (
                  <span className="label-eyebrow border border-border px-3 py-1.5 text-muted-foreground">
                    {o.status.replace(/_/g, " ")}
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="w-36">
                      <Progress value={(step / (ORDER_PROGRESS_STEPS.length - 1)) * 100} className="h-1" />
                      <p className="label-eyebrow mt-2 text-right text-muted-foreground">
                        {ORDER_PROGRESS_STEPS[step]}
                      </p>
                    </div>
                    {step === 0 && <OrderCancelAction orderId={o.id} onCancelled={refreshOrders} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-7 w-28" />
    </div>
  );
}
