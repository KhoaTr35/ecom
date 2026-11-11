import Link from "next/link";

// iPhone 16 Pro's real CSS viewport — 1206x2622 physical pixels at a 3x
// device pixel ratio, matching both Apple's published specs and Xcode
// Simulator's own iPhone 16 Pro device definition. This is the frame's
// visual size and aspect ratio (what the bezel occupies on the page) —
// CONTENT_ZOOM below deliberately gives the iframe a *different*, larger
// internal viewport, so this is no longer literally what the embedded
// page itself measures. Still the number that matters for correctness,
// though: the iframe's actual internal width (402/CONTENT_ZOOM) stays
// comfortably under Tailwind's 1024px `lg:` breakpoint, which is the only
// thing that decides whether the mobile or desktop UI renders.
const PHONE_WIDTH_PX = 402;
const PHONE_HEIGHT_PX = 874;
const PHONE_ASPECT_RATIO = `${PHONE_WIDTH_PX} / ${PHONE_HEIGHT_PX}`;
// Reserved status-bar strip above the iframe, sized to hold the Dynamic
// Island with clearance — see the comment at the frame below for why this
// has to be reserved space rather than an overlay.
const STATUS_BAR_HEIGHT_PX = 36;
// The frame's own visual footprint (border, status bar, overall box size on
// the page) is intentionally untouched by this constant — only what's
// *inside* the screen should look smaller. Giving the iframe a genuinely
// larger internal viewport (402/CONTENT_ZOOM CSS px, so every element the
// app renders has proportionally more room) and then using `zoom` to shrink
// just the iframe's own rendering back down to the original visual size
// means the app's text/UI ends up occupying a smaller fraction of the same
// fixed-size screen — the actual ask — without changing the frame's size on
// the page at all, unlike scaling the whole bezel. Deliberately moves the
// iframe's internal width away from the iPhone 16 Pro's literal 402px
// (still comfortably under the 1024px `lg:` breakpoint, so the mobile UI
// still renders correctly) in exchange for content that doesn't look
// cramped in a demo. 0.8 is a moderate starting correction, visual by
// nature — nudge it if content still looks too large or too small.
const CONTENT_ZOOM = 0.8;

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
          The real site, framed at an iPhone 16 Pro&apos;s size ({PHONE_WIDTH_PX}×{PHONE_HEIGHT_PX}). On an actual
          phone the site looks like this natively — this frame exists so it can be experienced from a laptop too.
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
            on any laptop shorter than ~900px of available viewport.

            The height fed in here is the *visual* budget (same as the
            frame's own size) divided by CONTENT_ZOOM — i.e. deliberately
            larger than what should actually render on screen — so the
            `zoom` below has something to shrink back down. Net effect:
            the iframe's rendered footprint lands exactly on the original
            visual budget (frame size unchanged), while its internal CSS
            viewport is genuinely wider, giving the app's own content more
            room and making it look proportionally smaller within the same
            fixed-size screen. */}
        <iframe
          src="/wall"
          title="Mobile UI preview — iPhone 16 Pro"
          className="block bg-background"
          style={{
            height: `calc(min(calc(100svh - 14rem - ${STATUS_BAR_HEIGHT_PX}px), ${PHONE_HEIGHT_PX}px) / ${CONTENT_ZOOM})`,
            aspectRatio: PHONE_ASPECT_RATIO,
            zoom: CONTENT_ZOOM,
          }}
        />
      </div>
    </div>
  );
}
