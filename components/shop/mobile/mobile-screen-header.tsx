import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shared 96px top bar for mobile-only screens (Wall, a collection, checkout,
 * settings, info) — back chevron / centred title / trailing actions, the
 * recurring header shape across design pages 05–16. `lg:hidden`: desktop
 * never renders this, it uses the existing `Header`. */
export function MobileScreenHeader({
  backHref,
  title,
  actions,
}: {
  backHref?: string;
  title?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex h-24 items-center justify-between px-2 pt-11 lg:hidden">
      {backHref ? (
        <Button variant="ghost" size="icon" aria-label="Back" render={<Link href={backHref} />}>
          <ChevronLeft className="size-[22px]" strokeWidth={1.8} />
        </Button>
      ) : (
        <span className="size-11" />
      )}
      {title && <span className="text-base font-semibold">{title}</span>}
      <div className="flex items-center">{actions ?? <span className="size-11" />}</div>
    </header>
  );
}
