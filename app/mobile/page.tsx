import Link from "next/link";

// iPhone 16 Pro's real CSS viewport — 1206x2622 physical pixels at a 3x
// device pixel ratio, matching both Apple's published specs and Xcode
// Simulator's own iPhone 16 Pro device definition. Width is the decisive
// number for correctness: Tailwind's `lg:` breakpoint only ever reads
// viewport *width*, so whatever width lands on the iframe is what actually
// determines which UI (desktop vs. mobile) the framed page renders.
const PHONE_WIDTH_PX = 402;
const PHONE_HEIGHT_PX = 874;
const PHONE_ASPECT_RATIO = `${PHONE_WIDTH_PX} / ${PHONE_HEIGHT_PX}`;
// Reserved status-bar strip above the iframe, sized to hold the Dynamic
// Island with clearance — see the comment at the frame below for why this
// has to be reserved space rather than an overlay.
const STATUS_BAR_HEIGHT_PX = 36;

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
          The real site, framed at an iPhone 16 Pro&apos;s exact viewport ({PHONE_WIDTH_PX}×{PHONE_HEIGHT_PX}). On an
          actual phone the site looks like this natively — this frame exists so it can be experienced from a laptop
          too.
        </p>
        <Link href="/" className="mt-2 inline-block text-sm underline">
          Open the desktop site
        </Link>
      </div>

      {/* No width or height of its own — sized entirely by wrapping its
          children's border-box, so the border never eats into the exact
          dimensions that need to land on the iframe itself. overflow-hidden
          + one border-radius here (not on the children individually) clips
          the status-bar strip and the iframe into a single rounded phone
          shape, so their corners can't mismatch. */}
      <div className="relative inline-flex flex-col overflow-hidden rounded-[2.5rem] border-[10px] border-foreground/90 bg-foreground/90 shadow-xl">
        {/* Status-bar strip, reserved space above the iframe — not an
            overlay on top of it. An earlier version absolute-positioned the
            Dynamic Island over the iframe's own top edge, which worked by
            luck only because the real site's pages don't reserve a safe
            area at the top (only the bottom tab bar uses
            env(safe-area-inset-bottom)); any page whose content actually
            starts at the very top — the Wall's profile header — collided
            with the island. Reserving real space here means no page inside
            the iframe can ever collide with it, regardless of that page's
            own layout. */}
        <div className="flex h-9 shrink-0 items-center justify-center bg-background">
          <div className="h-6 w-28 rounded-full bg-foreground/90" />
        </div>
        {/* Driven from height, not width: on a laptop screen the vertical
            space is the binding constraint (a 874px-tall phone mockup
            rarely fits under a page header), so height is set directly
            (capped at the device's true 874px — never scale up past real
            size) and width is left to `aspect-ratio` to derive. Setting
            width directly instead — as an earlier version of this frame
            did — let an independent `max-height` clip the box without
            shrinking width to match, silently distorting the proportions
            on any laptop shorter than ~900px of available viewport. The
            status-bar strip's height comes out of the same budget so the
            overall frame still fits. */}
        <iframe
          src="/wall"
          title="Mobile UI preview — iPhone 16 Pro"
          className="block bg-background"
          style={{
            height: `min(calc(100svh - 14rem - ${STATUS_BAR_HEIGHT_PX}px), ${PHONE_HEIGHT_PX}px)`,
            aspectRatio: PHONE_ASPECT_RATIO,
          }}
        />
      </div>
    </div>
  );
}
