"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/client";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderCancelAction } from "@/components/shop/order-cancel-action";
import { MobileOrderCard } from "@/components/shop/mobile/mobile-order-card";
import { ORDER_PROGRESS_STEPS, orderProgressStep } from "@/lib/order/progress";
import { formatVnd } from "@/lib/utils";

type OrderRow = { id: string; code: string; status: string; total: number; createdAt: string };
type AddressRow = { id: string };

export default function MyOrdersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);

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
    fetch("/api/addresses")
      .then((res) => res.json())
      .then((json) => setAddresses(json.data ?? []))
      .catch(() => {});
  }, [session]);

  // "no orders yet" and "not fetched yet" both start as an empty array —
  // only show the empty state once loading has actually finished.
  const loading = isPending || !session || ordersLoading;
  const inProgressCount = orders.filter((o) => {
    const step = orderProgressStep(o.status);
    return step !== null && step < ORDER_PROGRESS_STEPS.length - 1;
  }).length;

  return (
    <>
      {session && (
        <section className="mb-10 flex flex-col gap-3 lg:hidden">
          <div className="flex items-center gap-5">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full border border-border bg-muted font-heading text-2xl">
              {session.user.name?.slice(0, 2).toUpperCase() ?? "?"}
            </div>
            <div className="grid flex-1 grid-cols-3 text-center">
              <Stat value={orders.length} label="orders" />
              <Stat value={inProgressCount} label="in progress" />
              <Stat value={addresses.length} label="address" />
            </div>
          </div>
          <div>
            <p className="font-heading text-xl">{session.user.name}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{session.user.email}</p>
          </div>
          <Link
            href="/account/settings"
            className="flex h-10 items-center justify-center rounded-md bg-muted text-[12px] font-semibold uppercase tracking-[0.08em]"
          >
            Edit profile
          </Link>
        </section>
      )}

      <h1 className="hidden font-heading text-5xl leading-tight lg:block">Orders</h1>

      {loading ? (
        <div className="mt-12 divide-y divide-border border-y border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderRowSkeleton key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <p className="mt-12 rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
          You don&apos;t have any orders yet.
        </p>
      ) : (
        <>
          <ul className="mt-8 flex flex-col gap-3 lg:hidden">
            {orders.map((o) => (
              <MobileOrderCard key={o.id} order={o} onCancelled={refreshOrders} />
            ))}
          </ul>

          <div className="mt-12 hidden divide-y divide-border border-y border-border lg:block">
            {orders.map((o) => {
              const step = orderProgressStep(o.status);
              return (
                <div key={o.id} className="flex items-center justify-between gap-6 py-5">
                  <div>
                    <p className="font-mono text-sm">{o.code}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatVnd(o.total)}</p>
                  </div>
                  {step === null ? (
                    <span className="label-eyebrow rounded-4xl border border-border px-3 py-1.5 text-muted-foreground">
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
        </>
      )}
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
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
