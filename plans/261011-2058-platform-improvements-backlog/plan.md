# Platform improvements backlog

Previous backlog (`plans/261010-1519-shadcn-component-backlog/`) is complete.
This one is sourced from real gaps found by grepping `TODO (IMP-xx)` markers
and auditing feature completeness (customer order lifecycle, checkout,
analytics) — not invented features. Each item: why it's real, scope, status.

## 1. Customer order self-cancel
Admin can cancel/refund orders (`components/admin/order-actions.tsx`); a
customer with a `PENDING_PAYMENT`/`PENDING_CONFIRM` order has no way to cancel
their own order — no endpoint, no button. `transitionOrder` in
`lib/order/index.ts` already allows this transition; just needs a
customer-scoped API route (ownership check) + a button on
`account/orders`.
- [x] `POST /api/orders/[id]/cancel` — ownership check, only allowed from
      PENDING_PAYMENT/PENDING_CONFIRM, reuse `transitionOrder`.
- [x] Cancel button + confirm dialog on `account/orders/page.tsx`, reuse
      `AlertDialog` pattern from `address-manager.tsx`.
      Verified against the real dev DB: placed a COD order (→
      PENDING_CONFIRM) as `customer1`, confirmed `staff` can't cancel it
      (404, ownership check), owner cancel works and restocks the variant
      (5→6), re-cancelling the now-CANCELLED order correctly 409s via
      `transitionOrder`'s own transition table — no bespoke status check
      needed in the route.

## 2. Checkout reads the saved address book
README already flags this: checkout always collects a fresh address, never
offers the address book added for account settings. `GET /api/addresses`
already exists.
- [x] Checkout page: if the signed-in user has saved addresses, show a picker
      (default preselected) with an "enter a different address" fallback to
      the existing manual fields.
- [x] Guest/no-saved-address path unchanged (manual fields only).
      Verified: `customer1` (has a saved default address) reused it end-to-end
      — order placed with that `addressId`, address count stayed at 1 (no
      duplicate POST). `staff` (no saved addresses) still gets the manual
      form directly, same as before.

## 3. Recommendation co-occurrence (`IMP-40`)
`lib/recommend/index.ts` has a stubbed TODO — recommendations currently fall
back to same-category products instead of actual co-purchase data.
- [x] Count variant-level co-occurrence across PAID/DELIVERED orders, rank by
      frequency, keep the same-category fallback when a product has no
      order history yet (cold start).
      Wired into the PDP (`app/(shop)/p/[slug]/page.tsx`) as a new
      "Frequently bought together" section above the existing "You may also
      like" — hidden when it'd just duplicate the fallback list (no order
      history yet). Pure ranking logic extracted to `rankCoPurchasedProducts`
      and unit-tested (`tests/unit/recommend.test.ts`). Verified against the
      real DB: manufactured two DELIVERED orders pairing a wool coat with
      wide-leg trousers (different categories) — PDP correctly showed the
      trousers under "bought together" and a same-category dress under
      "you may also like"; after deleting those orders the section
      correctly disappeared again (cold-start fallback, no duplicate list).

## 4. Analytics funnel (`IMP-41`)
`AnalyticsEvent` model exists in schema but nothing ever writes to it — zero
instrumentation. `app/admin/analytics/page.tsx` has a TODO for a funnel that
can't be built without events first.
- [x] Emit `page_view`/`product_view` (route-change tracker in the shop
      layout), `add_to_cart` (purchase panel), `begin_checkout` (checkout
      mount), `purchase` (order placed) — all through a new public
      `POST /api/analytics/track`, since most of this traffic (product_view,
      add_to_cart) is anonymous, pre-login. Also had to build what IMP-41
      depended on but didn't exist yet: the plan's own design
      (`sessionId` only set after cookie consent) had no consent UI, so
      added `CookieConsentBanner` + the `analytics_sid`/`cookie_consent`
      cookies it sets. Without this, `track()` existed but was never called
      anywhere — the "Visits" KPI tile had been silently stuck at 0 since
      it was built.
- [x] Simple funnel: event counts per stage over the existing date range,
      bar chart via the existing `Chart` wrapper (`FunnelChart`). No
      per-user session stitching — counts only, matches this project's
      analytics depth elsewhere (KPIs are aggregate, not cohort-based).
      Verified against the real dev DB: posted all 5 event types for a
      synthetic session through the real API (consent cookie present →
      recorded; absent → silently no-op; invalid `type` → clean 400), then
      confirmed the admin analytics page actually reflects it — Visits tile
      went from a permanent 0 to 1, funnel chart's RSC payload showed all
      4 stages at `sessions: 1`. Cleaned up the synthetic rows after.

## 5. [BLOCKED] Rate-limit `/api/cart/quote`
Flagged in code (`app/api/cart/quote/route.ts`) as waiting on "a shared
limiter" that doesn't exist yet. Building a bespoke limiter for one route
pre-empts that decision (in-memory vs Redis vs middleware — depends on
deploy target, which isn't decided). Left blocked; revisit once a shared
rate-limit approach is picked for the project, not invented here for one
endpoint.

## Status: complete — items 1-4 implemented and verified against the real dev DB. Item 5 stays blocked (see above).
