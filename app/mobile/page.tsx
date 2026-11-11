import Link from "next/link";

// iPhone 16 Pro's real CSS viewport — 1206x2622 physical pixels at a 3x
// device pixel ratio, per Apple's published specs. The width is the
// decisive number: Tailwind's `lg:` breakpoint only ever reads viewport
// *width*, so this is what actually determines which UI (desktop vs.
// mobile) the framed page renders. Height is left responsive (capped to
// fit the laptop viewport, same aspect ratio) rather than hardcoded to 874,
// since a real phone screen is the same deal — it only ever shows a
// scrollable portion of a tall page, never the whole thing at once.
const PHONE_WIDTH_PX = 402;
const PHONE_ASPECT_RATIO = "402 / 874";

/**
 * Demo route: the real site, framed at iPhone 16 Pro width, so the
 * mobile-first UI (Feed, Wall, tab bar — see `components/shop/mobile/`) can
 * be experienced from a laptop. A plain CSS resize of the real page
 * wouldn't work here — Tailwind's `lg:` classes respond to the actual
 * browser viewport, not a parent element's width — so only an iframe's
 * independent viewport genuinely re-triggers the mobile breakpoints.
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
        <h1 className="text-xl font-semibold">Mobile-first UI — iPhone 16 Pro</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The real site, framed at an iPhone 16 Pro&apos;s exact viewport (402×874). On an actual phone the site looks
          like this natively — this frame exists so it can be experienced from a laptop too.
        </p>
        <Link href="/" className="mt-2 inline-block text-sm underline">
          Open the desktop site
        </Link>
      </div>

      {/* Sized by its border-box content (the iframe below), not by an
          explicit width of its own — avoids the border eating into the
          402px that must land on the iframe exactly, not the wrapper. */}
      <div className="relative inline-block rounded-[3rem] border-[10px] border-foreground/90 bg-foreground/90 shadow-xl">
        {/* Dynamic Island */}
        <div className="absolute inset-x-0 top-2 z-10 mx-auto h-7 w-28 rounded-full bg-foreground/90" />
        <iframe
          src="/"
          title="Mobile UI preview — iPhone 16 Pro"
          className="block rounded-[2.25rem] bg-background"
          style={{ width: PHONE_WIDTH_PX, aspectRatio: PHONE_ASPECT_RATIO, maxHeight: "calc(100svh - 14rem)" }}
        />
      </div>
    </div>
  );
}
