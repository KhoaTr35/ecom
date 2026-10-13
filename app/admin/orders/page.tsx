import { prisma } from "@/lib/db";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderStatusTabs } from "@/components/admin/order-status-tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVnd } from "@/lib/utils";

/** Groups the 8 raw OrderStatus values into the stages staff actually act on —
 * same grouping as the customer-facing progress stepper in account/orders. */
const STATUS_TABS = [
  { value: "all", label: "All", statuses: [] as string[] },
  { value: "pending", label: "Pending", statuses: ["PENDING_PAYMENT", "PENDING_CONFIRM"] },
  { value: "processing", label: "Processing", statuses: ["PAID", "PROCESSING"] },
  { value: "shipped", label: "Shipped", statuses: ["SHIPPED"] },
  { value: "delivered", label: "Delivered", statuses: ["DELIVERED"] },
  { value: "cancelled", label: "Cancelled", statuses: ["CANCELLED", "REFUNDED"] },
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tabParam = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab = STATUS_TABS.find((t) => t.value === tabParam) ?? STATUS_TABS[0];

  const orders = await prisma.order
    .findMany({
      where: tab.statuses.length > 0 ? { status: { in: tab.statuses as never } } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    .catch(() => []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium">Orders</h1>

      <OrderStatusTabs tabs={STATUS_TABS} active={tab.value} />

      {orders.length === 0 ? (
        <p className="mt-4 rounded-lg border p-6 text-sm text-muted-foreground">No orders in this view.</p>
      ) : (
        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} id={`order-${o.id}`} className="target:bg-muted/50">
                  <TableCell className="font-mono">{o.code}</TableCell>
                  <TableCell>{formatVnd(o.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{o.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <OrderActions orderId={o.id} status={o.status} code={o.code} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
