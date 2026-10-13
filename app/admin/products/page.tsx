import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProductStatusSwitch } from "@/components/admin/product-status-switch";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminProductsPage() {
  const products = await prisma.product
    .findMany({ include: { variants: true }, orderBy: { createdAt: "desc" }, take: 50 })
    .catch(() => []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Products</h1>
        <Button render={<Link href="/admin/products/new">New product</Link>} />
      </div>

      {products.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No products yet</EmptyTitle>
            <EmptyDescription>Run pnpm db:seed, or create one.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead />
                <TableHead className="text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                return (
                  <TableRow key={p.id} id={`product-${p.id}`} className="target:bg-muted/50">
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{stock}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" render={<Link href={`/admin/products/${p.id}/edit`}>Edit</Link>} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductStatusSwitch productId={p.id} initialActive={p.status === "ACTIVE"} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
