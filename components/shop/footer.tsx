import Link from "next/link";
import { SHOP_LINKS, INFO_LINKS } from "@/components/shop/nav-links";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="text-base font-medium uppercase tracking-[0.3em]">Atelier</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Demo storefront built for a course project (CO3027). Not a real commercial store.
          </p>
        </div>

        <nav>
          <p className="label-eyebrow text-muted-foreground">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav>
          <p className="label-eyebrow text-muted-foreground">Information</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {INFO_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-5 py-6 text-xs text-muted-foreground sm:px-8">
          © {new Date().getFullYear()} Atelier — CO3027 course project
        </p>
      </div>
    </footer>
  );
}
