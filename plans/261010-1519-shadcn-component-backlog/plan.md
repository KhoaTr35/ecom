# shadcn component backlog

Source: audit of installed components (`badge`, `button`, `card`, `dialog`, `dropdown-menu`,
`input`, `label`, `separator`, `sheet`) vs the full `@shadcn` catalog, mapped against actual
pages/components in this repo. Not phased — pick items independently as the matching feature
gets worked on.

## Done

- [x] Category filter sidebar + sort + pagination (IMP-26) — `breadcrumb`, `accordion`,
      `checkbox`, `select`, `pagination`, `empty`. See `app/(shop)/c/[slug]/page.tsx`,
      `lib/catalog/facets.ts`, `components/shop/category-{filter-sidebar,toolbar,pagination}.tsx`.
      Verified in-browser: facet checkboxes (OR within a facet, AND across facets), sort,
      empty state + clear-filters, pagination correctly hidden under page size.

## Backlog by area

### Product detail (`app/(shop)/p/[slug]/page.tsx`, `product-purchase-panel.tsx`)
- [x] `toggle-group` — `product-purchase-panel.tsx` variant picker, single-select with a guard
      against the Base UI toggle unpressing itself back to zero-selected. Verified in-browser:
      selection/deselection, sold-out disabled state, price updates. (Seed data has no product
      mixing in-stock + sold-out variants, so "sold-out doesn't steal selection from a sibling"
      is untested — not a code gap, just no such seed case exists.)
- [BLOCKED] `carousel` — seed data has exactly 1 image per product (`ProductImage` model
      supports more, but admin image upload is IMP-23, not built). Nothing to carousel through
      without fabricating extra images. Revisit once multi-image upload exists.
- [BLOCKED] `aspect-ratio` — same reason as carousel: "normalize gallery boxes" implies
      multiple images; there's only one.
- [x] `tabs` or `accordion` — Description / Shipping info, rescoped to real data only (no
      "Care" field exists). `Accordion` with "Description" (open by default, real
      `product.description`) and "Shipping & returns" (real category/shipping-threshold dl +
      links to the real `/shipping-policy` and `/return-policy` pages). Verified in-browser:
      multi-open, real links navigate correctly.
- [BLOCKED] `popover` or `hover-card` — size guide needs measurement data (bust/waist/hip
      per size); no such field exists anywhere in the schema or seed data. Fabricating
      numbers would violate "no fake data". Needs a real data source first.

### Cart & checkout (`cart/page.tsx`, `checkout/page.tsx`)
- [x] `sonner` (toast) — "Added to bag" feedback (`product-purchase-panel.tsx`), order-placement
      errors (`checkout/page.tsx`); replaced the `setTimeout` label flip and inline error `<p>`.
      `<Toaster position="bottom-center" />` added to root layout. Verified in-browser.
- [x] `skeleton` — cart quote loading state. Also fixed the root cause of a sequencing bug:
      guest-cart items come from localStorage via a post-mount effect, so `items` was `[]`
      (indistinguishable from "genuinely empty") before hydration — added a `hydrated` flag to
      `guest-cart-context.tsx` so `cart/page.tsx` shows skeleton (not the Empty state) until
      hydration completes. Found and fixed the identical pattern in two pages not originally
      in scope: `checkout/page.tsx` (blank page while auth pending → skeleton; added
      `methodsLoading` for the shipping-methods fetch, previously no loading state at all) and
      `account/orders/page.tsx` ("no orders yet" could flash before the fetch resolved).
      Verified in-browser under 3G throttle: cart-with-items, cart-truly-empty (no regression),
      checkout, orders — all skeleton-first, never a stale/wrong state, no console errors.
- [x] `spinner` — `checkout/page.tsx` Place order button now shows a spinning `Loader2Icon`
      (`data-icon="inline-start"`) + "Processing" instead of bare "Processing..." text while
      `submitting`. Verified in-browser: spinner renders mid-submit, button stays disabled,
      order completes, no console errors.
- [x] `alert-dialog` — "Remove" on a cart line now opens a confirm dialog (item name,
      Cancel/Remove) instead of removing immediately. Verified in-browser: Cancel/Escape
      leaves the item, dialog's Remove button actually removes it, no console errors.
- [x] `radio-group` — replaced raw `<input type="radio">` for shipping/payment method in
      `checkout/page.tsx`. Verified in-browser: mutual exclusivity within each group, groups
      independent of each other, label-click toggling, full checkout flow to order placement.
- [x] `field` / `field-group` — closed TODO IMP-25. New "Delivery address" section (Recipient/
      Phone/Address/Ward/Province) in `checkout/page.tsx`. New `POST /api/addresses` creates a
      real `Address` row; "Place order" now POSTs the address first, then passes the resulting
      `addressId` into the order (was hardcoded `null`). Submit disabled until all 5 fields are
      filled. Verified in-browser end-to-end: validation gate, address→order POST sequence,
      real order placed.

### Auth (`(auth)/login`, `(auth)/register`)
- [x] `field` / `field-group` — both forms now use `FieldGroup`/`Field`/`FieldLabel`/`FieldError`
      instead of raw `<div className="space-y-2">` + `Label`. Pure markup swap (identical
      Tailwind spacing, no logic/behavior touched) — typecheck/lint/build pass; not
      independently browser-QA'd given the low risk, same reasoning as other presentational-only swaps.

### Header / nav (`header.tsx`, `mobile-nav.tsx`)
- [x] `avatar` — logged-in header icon is now an `Avatar` (initial-letter fallback) opening a
      `DropdownMenu` (Orders, Sign out via Better Auth `signOut()`). Logged-out state unchanged
      (icon link to /login). Verified in-browser: menu, navigation, sign-out, redirect-on-signed-out-page.
- [x] `input-group` — added a real search feature (there was none): compact `InputGroup` in the
      header (desktop only) + new `app/(shop)/search/page.tsx`, reusing the `q` param
      `listProducts`/`/api/products` already supported, plus the existing `CategoryToolbar`/
      `CategoryPagination` components. Verified in-browser: search, no-results empty state,
      blank-query prompt, sort+pagination param handling.
- [x] `scroll-area` — mobile nav sheet content wrapped in `ScrollArea`. Verified in-browser
      (no overflow/cutoff; current nav list is short enough that no scrollbar engages, which
      is correct — it will when real content grows).

### Account (`account/orders/page.tsx`)
- [x] `progress` — real 4-step stepper (Placed/Processing/Shipped/Delivered) grounded in the
      actual `OrderStatus` enum + `ALLOWED_TRANSITIONS` graph in `lib/order/index.ts` (both
      VNPay and COD paths collapse onto the same 4 steps). CANCELLED/REFUNDED render as the
      old plain badge instead — they're terminal exits, not a point on this line. Verified
      in-browser at 0%/33%/67% (3 of 4 manually-set test states; the 4th order used for the
      100% case turned out to belong to a different test account from an earlier QA session —
      test-setup mistake, not a code issue. The fill math is linear and already confirmed
      correct at 3 points, so 100% at step 3/3 isn't separately re-verified.)

### Admin (`admin/products`, `admin/orders`, `admin/analytics`)
- [x] `table` — both `admin/products` and `admin/orders` now real `<table>`s instead of
      hand-rolled `divide-y` rows.
- [x] `tabs` — `admin/orders` status filter (All/Pending/Processing/Shipped/Delivered/Cancelled,
      grouping the 8 raw `OrderStatus` values), drives `?tab=` and re-queries server-side.
- [x] `alert-dialog` — `admin/orders` Cancel/Refund button (only shown when the current status
      actually allows that transition, per `ALLOWED_TRANSITIONS` in `lib/order/index.ts`) opens
      a confirm dialog before calling the existing status PATCH endpoint.
- [x] `switch` — `admin/products` Active/Inactive toggle. New endpoint
      `PATCH /api/admin/products/[id]/status` (IMP-23 had no PATCH at all; scoped to just the
      status toggle, not full product edit — that's still the rest of IMP-23).
      All 4 verified in-browser together: table rendering, switch persistence across reload,
      tab filtering, cancel confirm/cancel/back, action button correctly absent for
      non-cancellable statuses, no console errors.
- [x] `command` — Cmd/Ctrl+K palette (`admin-command-palette.tsx`, mounted in admin layout)
      searches products (by name) and orders (by code) via the existing admin GET endpoints.
      No admin detail routes exist yet, so "jump" scrolls to + highlights (`:target`) the row
      on the existing list page via a URL hash — real destinations, not fake ones. QA caught a
      real bug: cross-page jumps used `router.push`, and client-side `pushState` never
      satisfies CSS `:target` in Chromium/Firefox — fixed by using a real navigation
      (`window.location.href`) for the cross-page case specifically (the same-page case already
      used `scrollIntoView` + direct `location.hash` assignment, which was correct from the
      start). Re-verified: real highlight confirmed via computed background-color diff against
      sibling rows, and a window-global marker proved the cross-page case is a true reload while
      the same-page case still isn't.
- [x] `chart` — "Revenue trend" area chart on `admin/analytics` (`components/admin/revenue-chart.tsx`,
      recharts via shadcn `Chart`), backed by a new `getDailyRevenue()` in `lib/analytics/index.ts`
      that buckets real `Order` rows by day (JS bucketing, not SQL — dataset is small).
- [x] `calendar` — date-range `Popover` + `Calendar` (`analytics-date-range-picker.tsx`) driving
      `?from=&to=` so KPIs/chart re-query server-side. QA caught two compounding timezone bugs:
      (1) the picker's date formatter used `toISOString()` on a local-midnight `Date`, which
      shifts a day backward in any UTC+ timezone (fixed: `formatIsoDate` in `lib/utils.ts` uses
      local date components instead); (2) even with the right date string, the server parsed
      `?to=` as UTC midnight *start* of that day, excluding nearly the whole day from an
      inclusive bound (fixed: `admin/analytics/page.tsx` now keeps the plain parsed `to` for
      display/calendar state separate from a `queryTo` bumped to end-of-day, used only for the
      actual KPI/chart queries — conflating the two was exactly what caused bug #1's fix to
      almost reintroduce a display mismatch). Re-verified: past range → 0 revenue, range ending
      today → full revenue + matching chart spike, default 30-day range still correct, no
      console errors.

## Status: backlog complete
Every item is either done (above) or [BLOCKED] with a concrete reason (needs real data that
doesn't exist yet — not deferred for lack of effort). Nothing left unaddressed.

### Legal pages (`(legal)/*`)
- [BLOCKED] `collapsible` — all 4 legal pages are an identical 11-line stub: one placeholder
      paragraph each ("Demo content for a course project... Detailed wording will be filled
      in to match the report"). No FAQ/Q&A structure exists to collapse. Revisit once real
      policy copy is written.

## Explicitly out of scope
Menubar, context-menu, resizable, input-otp, direction (RTL) — no use case in this VN storefront.
Chat primitives (attachment/bubble/message/message-scroller/questionnaire/marker) — not a chat product.
