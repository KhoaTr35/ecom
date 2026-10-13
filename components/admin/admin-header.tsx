import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Top bar for the admin panel — the nav rail below only covers Overview/
 * Products/Orders/Analytics, nothing in there links back to the storefront. */
export function AdminHeader() {
  return (
    <div className="mb-10 flex items-center justify-between border-b border-border pb-6">
      <Link href="/admin" className="text-sm font-medium uppercase tracking-[0.3em]">
        Atelier
      </Link>
      <Button
        variant="outline"
        size="sm"
        render={
          <Link href="/">
            <ArrowLeft data-icon="inline-start" />
            Back to store
          </Link>
        }
      />
    </div>
  );
}
