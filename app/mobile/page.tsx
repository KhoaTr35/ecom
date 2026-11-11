import Link from "next/link";

const PHONE_WIDTH_PX = 390;

/**
 * Demo route: the real site, framed at phone width, so the mobile-first UI
 * (Feed, Wall, tab bar — see `components/shop/mobile/`) can be experienced
 * from a laptop. A plain CSS resize of the real page wouldn't work here —
 * Tailwind's `lg:` classes respond to the actual browser viewport, not a
 * parent element's width — so only an iframe's independent viewport
 * genuinely re-triggers the mobile breakpoints.
 *
 * Deliberately outside the `(shop)` route group: this page gets none of the
 * shop layout's header/footer/tab bar/tracker, because the framed page it
 * loads renders all of those itself. `PageViewTracker` detects the framing
 * and skips, so browsing here doesn't inflate the admin analytics dashboard.
 */
export default function MobilePreviewPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-muted p-6">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-semibold">Mobile-first UI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The real site, framed at phone width. On an actual phone the site looks like this natively — this frame
          exists so it can be experienced from a laptop too.
        </p>
        <Link href="/" className="mt-2 inline-block text-sm underline">
          Open the desktop site
        </Link>
      </div>

      <iframe
        src="/"
        title="Mobile UI preview"
        className="rounded-[2rem] border-8 border-foreground/80 bg-background shadow-xl"
        style={{ width: PHONE_WIDTH_PX, height: "calc(100svh - 14rem)" }}
      />
    </div>
  );
}
