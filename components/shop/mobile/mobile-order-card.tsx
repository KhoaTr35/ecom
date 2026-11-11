import { ShoppingBag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { OrderCancelAction } from "@/components/shop/order-cancel-action";
import { ORDER_PROGRESS_STEPS, orderProgressStep } from "@/lib/order/progress";
import { formatVnd } from "@/lib/utils";

type OrderRow = { id: string; code: string; status: string; total: number; createdAt: string };

/** Order card for mobile (design page 14) — same progress model as the
 * desktop row (`lib/order/progress.ts`), laid out as a bordered card with a
 * 3-segment bar instead of a thin inline one. */
export function MobileOrderCard({ order, onCancelled }: { order: OrderRow; onCancelled: () => void }) {
  const step = orderProgressStep(order.status);

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border p-3.5">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ShoppingBag className="size-5" strokeWidth={1.6} />
        </span>
        <div className="flex-1">
          <p className="font-mono text-[13px]">{order.code}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatVnd(order.total)}</p>
        </div>
        <span className="label-eyebrow rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
          {step === null ? order.status.replace(/_/g, " ") : ORDER_PROGRESS_STEPS[step]}
        </span>
      </div>

      {step !== null && (
        <>
          <Progress value={(step / (ORDER_PROGRESS_STEPS.length - 1)) * 100} className="h-1" />
          <div className="grid grid-cols-4 text-[10px] text-muted-foreground">
            {ORDER_PROGRESS_STEPS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </>
      )}

      {step === 0 && (
        <div className="self-start">
          <OrderCancelAction orderId={order.id} onCancelled={onCancelled} />
        </div>
      )}
    </li>
  );
}
