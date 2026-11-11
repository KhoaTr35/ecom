import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

const LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PENDING_CONFIRM: "Order placed",
  PAID: "Payment received",
  CANCELLED: "Order cancelled",
};

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: code } = await searchParams;
  const order = code ? await prisma.order.findUnique({ where: { code } }).catch(() => null) : null;

  return (
    <div className="mx-auto max-w-md px-5 py-32 text-center">
      <p className="label-eyebrow text-muted-foreground">
        {order ? "Thank you" : "Not found"}
      </p>
      <h1 className="mt-6 font-heading text-4xl leading-tight sm:text-5xl">
        {order ? (LABEL[order.status] ?? order.status) : "Order not found"}
      </h1>

      {order && (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            Order <span className="font-mono text-foreground">{order.code}</span>
          </p>
          {order.status === "PENDING_PAYMENT" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Confirming payment — this page will update once VNPay sends the result.
            </p>
          )}
        </>
      )}

      <Button
        size="lg"
        className="label-eyebrow mt-10 h-12 px-10"
        render={<Link href="/account/orders">View my orders</Link>}
      />
      <Link href="/" className="mt-4 block text-sm text-muted-foreground">
        Keep browsing
      </Link>
    </div>
  );
}
