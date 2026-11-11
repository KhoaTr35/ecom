# Runbook — Mobile "Reel Commerce" Redesign (ATELIER / CO3027)

Status: approved, not started. Source design: `refs/Atelier-Mobile-Design-Vertical-Scroll.html`.

## Context

`refs/Atelier-Mobile-Design-Vertical-Scroll.html` is a 17-screen mobile redesign
of the storefront. It abandons "shrunken desktop" for a **short-video feed IA**:
products play full-screen one per swipe (Feed), and a swipe right lands on an
Instagram-style profile grid (Wall). A 5-tab bottom bar — Feed · Wall · Search ·
Bag · Me — replaces the hamburger menu and header icons.

Today's mobile is the desktop tree at a narrow width: `Header` + hamburger
`Sheet` + editorial hero + `Footer`. Every transactional screen already works
(cart, checkout, orders, addresses, auth, legal) — this redesign is a **shell and
presentation change**, not a re-plumbing of commerce logic.

Outcome: on `< lg`, the storefront reads as a native reel app; on `≥ lg` the
current desktop storefront is untouched.

### Reading the design file

It is a nested gzip bundle, not plain HTML. To re-extract the 17 screens:

```python
# refs/…html → line 476 holds a base64+gzip manifest of 17 pages;
# each page is itself a bundle whose "__bundler/template" script
# holds the real markup (inline styles, 390×844 phone frames).
import re, json, base64, gzip
src = open('refs/Atelier-Mobile-Design-Vertical-Scroll.html', errors='replace').read()
man = json.loads(re.search(r'__bundler/manifest">\s*(\{.*?\})\s*</script>', src, re.S).group(1))
order = json.loads(re.search(r'__bundler/page_order">\s*(\[.*?\])\s*</script>', src, re.S).group(1))
for i, pid in enumerate(order):
    page = gzip.decompress(base64.b64decode(man[pid]['data'])).decode('utf-8', 'replace')
    tpl = json.loads(re.search(r'__bundler/template">\s*(".*?")\s*</script>', page, re.S).group(1))
    open(f'/tmp/design-{i:02d}.html', 'w').write(tpl)   # strip @font-face noise when reading
```

### Decisions locked (confirmed with the user)

1. **Collection reels** — extend `Category` with `tagline` + `heroMediaUrl`
   only. Reel slides render headline, subcopy and a real 3-product strip from
   that category. **No** x/y pinned hotspots on the film (design page 02's
   hotspot layer is dropped; the product strip below it carries the same links).
2. **Feed media** — `ProductImage` unchanged. Add more real placeholder SVGs so
   story progress bars have multiple frames; a 1-image product renders 1 bar.
   No video field, no Storage bucket.
3. **Split strategy** — breakpoint split inside the existing routes. Mobile tree
   `lg:hidden`, today's desktop tree `hidden lg:block`. No UA sniffing; the
   existing `DevModeFrame` desktop/mobile preview toggle keeps working.
4. **Desktop is frozen.** Treat `≥ lg` as a no-change surface for the whole
   runbook — the course report's existing desktop screenshots must stay valid.
   Every mobile-only class is therefore written with an `lg:` reset
   (`pb-20 lg:pb-0`, `bottom-24 lg:bottom-6`), and gating `Header`/`Footer` to
   `lg` is a no-op at that width since both already render there. Phase 1 carries
   a 1280px before/after screenshot gate to prove it. Corollary: **do not** add
   desktop links to `/wall`, and do not touch the homepage's Collections section.
5. **`/wall` on desktop renders `CollectionPosterGrid`** — the same component the
   homepage already uses, not a copy of it, so the overlap is one component
   rendered by two routes rather than duplicated markup. A breakpoint-conditional
   redirect is impossible server-side (the server has no viewport) and would
   reintroduce UA sniffing, which decision 3 rules out; ~5 lines of reuse is the
   cheaper answer, and a `/wall` link shared to a desktop reader still lands on a
   page that lists every collection.

---

## Screen → route → component mapping

| # | Design screen | Route (unchanged) | Mobile tree | Desktop tree |
|---|---|---|---|---|
| 00 | Navigation model | — | spec only | — |
| 01 | Feed — product reel | `/` | `FeedReelScroller` + `FeedProductSlide` | existing `HomePage` body |
| 02 | Feed — collection reel | `/` (same scroller) | `FeedCollectionSlide`, every 4th item | — |
| 03 | Quick add sheet | `/` (overlay) | `QuickAddSheet` (`Sheet side="bottom"`) | — |
| 04 | Product detail | `/p/[slug]` | `MobileProductDetail` + `FeedStoryMedia` + `MobileStickyActionBar` | existing 2-col layout |
| 05 | The Wall | **`/wall` (new)** | `WallProfileHeader` + `WallCollectionHighlights` + `WallTileGrid` | `CollectionPosterGrid` (reuse, zero new work) |
| 06 | Collection wall | `/c/[slug]` | `WallTileGrid` + `MobileFilterChips` | existing sidebar + grid |
| 07 | Filter & sort sheet | `/c/[slug]` (overlay) | `CollectionFilterSheet` | existing `CategoryFilterSidebar` |
| 08 | Search results | `/search` | `MobileSearchScreen` | existing search page |
| 09 | Bag | `/cart` | `MobileBagList` + `MobileStickyActionBar` | existing cart page |
| 10 | Checkout | `/checkout` | `MobileCheckoutSteps` wrapping existing sections | existing checkout |
| 11 | Sign in to check out | `/login` | mobile form styling (sheet-like card) | existing |
| 12 | Create account | `/register` | mobile form styling | existing |
| 13 | Order placed | `/checkout/result` | mobile confirmation panel | existing |
| 14 | Me — orders | `/account/orders` | `MobileOrderCard` + account tabs | existing |
| 15 | Me — settings | `/account/settings` | mobile sections (reuse `AddressManager`, `ProfileForm`) | existing |
| 16 | Information | `/(legal)/*` | `MobileInfoTabs` + article | existing |

Routes are **unchanged** except the new `/wall`. The design's route map (page 00)
confirms every current path keeps its URL.

---

## Architecture

### Mobile shell — `app/(shop)/layout.tsx`

```tsx
<PageViewTracker />
<Header className="hidden lg:flex" />          {/* desktop only */}
<main className="flex-1 pb-20 lg:pb-0">{children}</main>
<Footer className="hidden lg:block" />
<MobileTabBar />                                {/* lg:hidden, fixed bottom */}
<CookieConsentBanner />
<FaqChatWidget className="bottom-24 lg:bottom-6" />  {/* clear the tab bar */}
```

- `MobileNav` (hamburger `Sheet`) is **deleted** — the Wall replaces it per the
  design's own route map. `nav-links.ts` stays (footer + Wall highlights + info
  tabs all read it).
- `main` gets `pb-20` so content clears the 80px tab bar; the Feed opts out
  (it is `h-[100dvh]` and owns its own scroll).
- Add `viewport` export to `app/layout.tsx`:
  `{ width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover" }`
  — `viewportFit: "cover"` + `env(safe-area-inset-bottom)` on the tab bar is what
  makes the design's `padding-bottom: 22px` correct on notched phones.

### Feed scrolling — CSS scroll-snap, no library

```css
/* container */ h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-y-contain
/* slide     */ h-[100dvh] snap-start snap-always relative
```

`IntersectionObserver` on slides sets the active index (pauses nothing today —
there is no video — but gates `priority` on `next/image` and the analytics
`product_view` event). **No embla, no framer-motion, no vaul.**

Swipe-right → `/wall`: one `touchstart`/`touchend` handler on the scroller;
horizontal delta > 60px and |dx| > |dy| ⇒ `router.push("/wall")`. The visible
"Wall →" affordance tab (design page 01, left edge) is the accessible equivalent
— the gesture is an enhancement, never the only way.

### Design tokens — reuse, don't add

Everything the design needs already exists in `app/globals.css`:

| Design value | Existing token |
|---|---|
| `#0a0a0a` / `#ffffff` | `--foreground` / `--background` |
| `#f4f4f5` | `--muted` / `--secondary` |
| `#e4e4e7` | `--border` |
| `#52525b`, `#71717a` | `--muted-foreground` |
| `#dc2626` (bag badge) | `--destructive` |
| `border-radius: 10px` | `rounded-md` (`0.75rem × 0.8` = 9.6px) |
| `20px 20px 0 0` sheets | `rounded-t-3xl` |
| Georgia serif display | `font-heading` (Instrument Serif) |
| 11px uppercase .12em | `label-eyebrow` utility |

The feed's dark surface (`#1c1a18`, `#1f1c19`) is the **only** new colour idea.
Add two tokens to `:root` in `globals.css` rather than hard-coding hex in
components:

```css
--feed:            #1c1a18;   /* warm near-black reel ground */
--feed-foreground: #ffffff;
```

plus `--color-feed` / `--color-feed-foreground` in the `@theme inline` block so
`bg-feed` / `text-feed-foreground` exist as utilities. Leave `.dark` alone — the
feed is intentionally dark in both themes.

---

## New files

All under `components/shop/mobile/`, kebab-case, each kept under ~200 lines.

| File | Type | Props | Purpose |
|---|---|---|---|
| `mobile-tab-bar.tsx` | client | — | 5 tabs; active from `usePathname()`, bag badge from `useGuestCart().count`; `fixed bottom-0 lg:hidden` + safe-area padding |
| `mobile-screen-header.tsx` | server | `{ backHref?, title?, actions? }` | the shared 96px top bar (back chevron / centre label / right actions) used by Wall, collection, checkout, settings, info |
| `mobile-sticky-action-bar.tsx` | server | `{ children }` | bottom-pinned CTA bar (product detail, bag, checkout) sitting above the tab bar |
| `feed-reel-scroller.tsx` | client | `{ items: FeedItem[], loadMoreHref? }` | scroll-snap container, active-index observer, swipe-right→`/wall` |
| `feed-story-media.tsx` | client | `{ images, alt, priority? }` | image stack + top progress bars + tap-left/right zones; **reused** by the product-detail gallery |
| `feed-product-slide.tsx` | client | `{ product: FeedProduct }` | media + gradient scrims + right rail (Wall/Add/Details/Share) + caption + size chips + add-to-bag |
| `feed-collection-slide.tsx` | client | `{ reel: FeedCollectionReel }` | category reel: tagline, headline, 3-product strip, "Shop the collection" + play |
| `quick-add-sheet.tsx` | client | `{ product, open, onOpenChange }` | `Sheet side="bottom"`: thumbnail, price, size grid, add-to-bag, `sonner` toast |
| `wall-profile-header.tsx` | server | `{ stats, tagline }` | avatar monogram, 3 stats, bio, two CTAs |
| `wall-collection-highlights.tsx` | server | `{ categories }` | story-circle row; type-led monogram tiles (no `Category` image exists — keeps the README's deliberate "no fake imagery" stance) |
| `wall-tile-grid.tsx` | server | `{ products, href }` | 3-col gapless tiles, price chip, sold-out badge, multi-image marker; used by Wall **and** `/c/[slug]` |
| `mobile-filter-chips.tsx` | client | `{ facets, sort, activeCount }` | sticky chip row that opens the filter sheet |
| `collection-filter-sheet.tsx` | client | `{ facets, sort, total }` | `Sheet side="bottom"`: sort pills, facet checkboxes with counts, Clear / "Show N pieces"; writes the **same query params** the desktop sidebar uses |
| `mobile-search-screen.tsx` | client | `{ results, categories }` | search field + recent queries (localStorage) + 2-col results + collections row |
| `mobile-bag-list.tsx` | client | `{ lines, quote }` | bag rows with qty stepper and remove |
| `mobile-checkout-steps.tsx` | server | `{ step, itemCount, total }` | 1-2-3 progress strip + collapsed `<details>` order summary |
| `mobile-order-card.tsx` | client | `{ order }` | order card: code, item count, status pill, 3-segment progress, cancel action |
| `mobile-info-tabs.tsx` | client | — | legal pill tabs reading `INFO_LINKS` from `nav-links.ts` |

### New lib

| File | Exports | Notes |
|---|---|---|
| `lib/catalog/feed.ts` | `interleaveFeed(products, reels, every)` (pure), `listFeedItems({ page, pageSize, scope })` | `scope: "for-you" \| "new-in" \| "sale"` drives the design's three header tabs. `"sale"` = products whose `unitFinal < unitBase` after `priceVariants` — derived, no new column. `interleaveFeed` is pure so it is unit-testable without a DB |
| `lib/order/progress.ts` | `ORDER_PROGRESS_STEPS`, `orderProgressStep(status)` | **Extracted** from `app/(shop)/account/orders/page.tsx:17-34` so mobile and desktop share one source (DRY — do not copy it) |

### New route

`app/(shop)/wall/page.tsx` — server component.
- Mobile: `WallProfileHeader` + `WallCollectionHighlights` + `Tabs` (All /
  Multi-image / On sale) + `WallTileGrid`.
- Desktop: renders the existing `CollectionPosterGrid` with the same
  `sidebarCategories` shape the homepage already builds. No new desktop design.
- Wall stats are all **derived**: `pieces` = total active products,
  `collections` = `listCategories().length`, `season` = the existing
  "Autumn / Winter 2026" brand string already on the homepage → "AW26".

---

## Reuse — do not rebuild

| Need | Already exists |
|---|---|
| Variant pricing with rule name for the discount badge | `lib/catalog/product-pricing.ts` → `priceVariants` returns `unitBase`, `unitFinal`, `appliedRule`. The design's `SPRING10` chip is `appliedRule` (real rule names: "Evening edit 8-10pm", "End of season markdown", "First order welcome") |
| Grid card price/sold-out logic | `toProductCards` → `fromPrice`, `fromBase`, `inStock` |
| Size chips + "Only 4 left in M" + sold-out line-through | `components/shop/product-purchase-panel.tsx` — the exact states the design draws. Mobile slides reuse its logic; extract nothing unless it grows past ~200 lines |
| Add to bag | `useGuestCart().addItem` + `trackClient("add_to_cart")` + `toast.success` |
| Facets, counts, sort, filter query params | `getCategoryFacets`, `buildCategoryFacets`, `SORT_VALUES`, `matchesCategoryFilters` |
| "Frequently bought together" + "More from …" | `lib/recommend` → `boughtTogether`, `similarProducts` (already co-occurrence-ranked over PAID/DELIVERED orders) |
| Checkout address / delivery / payment blocks | `CheckoutAddressSection`, `listShippingMethods()` (STANDARD 30k · EXPRESS · PICKUP free — matches the design's three rows), `PaymentMethod` enum (COD, VNPAY) |
| Order cancel | `components/shop/order-cancel-action.tsx` |
| Addresses with default badge, edit/delete, add | `AddressManager`, `AddressFormDialog` |
| Profile form | `components/shop/profile-form.tsx` |
| Toasts / empty states / spinners | `sonner`, `Empty`, `Spinner`, `Skeleton` |

---

## shadcn components: none to install

Every primitive the design needs is already in `components/ui/` (41 files):
`sheet` (verified: `side="bottom"` supported, `components/ui/sheet.tsx:46`),
`toggle-group`, `tabs`, `checkbox`, `accordion`, `avatar`, `badge`, `progress`,
`scroll-area`, `empty`, `spinner`, `skeleton`, `sonner`, `separator`,
`alert-dialog`, `dialog`, `input`, `button`, `radio-group`, `card`.

Deliberately **not** installed:

- **`carousel`** (embla) — the product gallery is story-style tap zones + CSS
  scroll-snap, which is a native platform feature. Adding embla buys nothing.
- **`drawer`** (vaul) — `Sheet side="bottom"` already gives the bottom sheet.
  Drag-to-dismiss is ~15 lines of `touchmove` on the grabber handle; vaul is a
  Radix-flavoured dep that would clash with this repo's `@base-ui/react`
  (`base-nova`) style.
- **`navigation-menu`** — the tab bar is 5 `Link`s; a component is overkill.

Note for implementers: this repo's shadcn style is **`base-nova` on
`@base-ui/react`, not Radix**. If anything new is ever added, use
`pnpm dlx shadcn@latest add <name>` so it resolves the same registry; never
hand-copy Radix snippets from the web.

---

## Data & Supabase changes

### Migration — one new migration, two nullable columns

`prisma/schema.prisma`:

```prisma
model Category {
  // … existing fields
  tagline      String?   // reel subcopy, e.g. "A pared-back wardrobe of tailoring…"
  heroMediaUrl String?   // 9:16 reel still for the collection slide
}
```

```bash
pnpm db:migrate --name add_category_reel_fields   # creates prisma/migrations/<ts>_add_category_reel_fields
pnpm db:generate
```

Generated SQL (both nullable ⇒ **no backfill, no downtime, no data loss**):

```sql
ALTER TABLE "Category" ADD COLUMN "tagline" TEXT;
ALTER TABLE "Category" ADD COLUMN "heroMediaUrl" TEXT;
```

**Supabase specifics:**

- The DB is the shared Supabase Postgres (see `README.md` + commit `b840b5f`).
  Apply via `pnpm db:migrate` against `DATABASE_URL` — **coordinate with the
  team before running**, same warning the README already carries for `db:seed`.
- RLS: `Category` already has RLS enabled with no policies (migration
  `20261110155500_enable_row_level_security`). Adding columns does not change
  that, and the app connects as the `BYPASSRLS` owner — **no policy work
  needed**. Do not add policies as part of this change.
- After migrating, refresh generated types if the Supabase MCP typegen output is
  used anywhere: `mcp__supabase__generate_typescript_types`. (Prisma's own
  client is regenerated by `pnpm db:generate`.)
- Verify with `mcp__supabase__list_tables` or
  `select column_name from information_schema.columns where table_name='Category'`.

### Seed data

`prisma/seed-data.json` — add `tagline` + `heroMediaUrl` to each of the 7
categories, and extra `images` entries per product (so story bars have frames):

```json
{ "slug": "new-arrivals", "name": "New Arrivals",
  "tagline": "Considered pieces, built to last — tailoring, knitwear and accessories in small runs.",
  "heroMediaUrl": "/collections/new-arrivals.svg",
  "filters": { "variantAxes": ["size"], "filters": ["material"] } }
```

`prisma/seed.ts` — pass the two new fields through the `Category` upsert. No
other seed change; the 70-order / 584-event demo history
(`prisma/seed-demo-history.ts`) already powers the Wall stats, the Me screen and
`boughtTogether`.

### No schema change for (verified against the design)

| Design element | Why no column is needed |
|---|---|
| `4.800.000 ₫` strike-through + `SPRING10` chip | `PriceRule` + `appliedRule` already produce both |
| "Only 4 left in M" / `XL` sold out | `ProductVariant.stock` |
| Wall "On sale" tab | derived: `unitFinal < unitBase` |
| Wall "Reels" tab | reframed as **Multi-image** — derived from `images.length > 1`. A `reel` boolean with no video assets behind it would be fake data |
| Story progress bars | `ProductImage.sortOrder` |
| Filter size/colour facets | `Category.filters` JSON + `buildCategoryFacets`. Seed variants only carry `size` + `material` today, so the sheet renders **those** facets — the design's colour swatch row appears only if colour variants are ever seeded. Do not hard-code swatches |
| Checkout delivery rows | `ShippingMethod` table |
| Order status timeline | `OrderStatus` enum + `lib/order/progress.ts` |
| Recent searches | `localStorage`, client-only |
| Order code chip | existing `generateOrderCode` → `ORD…` (`lib/order/index.ts:9`). The design's `ATL-20F91C` is cosmetic; keep `ORD…` so existing seeded orders stay consistent |

### Assets

`public/products/` — add alternate views alongside the existing three SVGs, same
monochrome line-art language:
`garment-back.svg`, `garment-detail.svg`, `bag-back.svg`, `bag-detail.svg`,
`jewellery-detail.svg`.
`public/collections/` — one 9:16 SVG per category for `heroMediaUrl`.
`next.config.ts` already sets `images.dangerouslyAllowSVG: true`.

---

## Phases

### Phase 1 — Shell (no data work)
- [ ] `globals.css`: add `--feed` / `--feed-foreground` + `@theme inline` entries
- [ ] `app/layout.tsx`: add the `viewport` export
- [ ] `components/shop/mobile/mobile-tab-bar.tsx`, `mobile-screen-header.tsx`, `mobile-sticky-action-bar.tsx`
- [ ] `app/(shop)/layout.tsx`: mount tab bar, gate `Header`/`Footer` to `lg`, `pb-20` on `main`, lift `FaqChatWidget` above the bar
- [ ] Delete `components/shop/mobile-nav.tsx` and its `Header` usage
- [ ] Gate: `pnpm lint && pnpm build`
- [ ] Gate (decision 4): screenshot `/`, `/c/new-arrivals`, `/p/<slug>`, `/cart`
      at 1280px **before** the first edit and again after — desktop must be
      unchanged. Any diff means a mobile-only class is missing its `lg:` reset

### Phase 2 — Data + migration
- [ ] `schema.prisma`: `Category.tagline`, `Category.heroMediaUrl`
- [ ] `pnpm db:migrate --name add_category_reel_fields` (coordinate first) → `pnpm db:generate`
- [ ] Seed data + `seed.ts` pass-through; new SVG assets
- [ ] `lib/catalog/feed.ts`: `interleaveFeed` (pure) + `listFeedItems`
- [ ] `lib/order/progress.ts`: extract from the orders page, update that page to import it
- [ ] `tests/unit/feed-interleave.test.ts` — asserts a reel lands every Nth slot, order is stable, and short/empty reel lists degrade to products-only
- [ ] Gate: `pnpm test && pnpm build`

### Phase 3 — Feed + Wall (the redesign's core)
- [ ] `feed-story-media.tsx`, `feed-product-slide.tsx`, `feed-collection-slide.tsx`, `feed-reel-scroller.tsx`, `quick-add-sheet.tsx`
- [ ] `app/(shop)/page.tsx`: mobile `FeedReelScroller` / desktop existing body
- [ ] `wall-profile-header.tsx`, `wall-collection-highlights.tsx`, `wall-tile-grid.tsx`
- [ ] `app/(shop)/wall/page.tsx` (new route, both trees)
- [ ] Gate: `pnpm build`, then walk `/` and `/wall` at 390px

### Phase 4 — Browse: collection, filters, search
- [ ] `mobile-filter-chips.tsx`, `collection-filter-sheet.tsx` (same query params as desktop)
- [ ] `/c/[slug]`: mobile header + chips + `WallTileGrid`; "Play as reel" → `/?scope=<slug>`
- [ ] `mobile-search-screen.tsx` + `/search` mobile tree
- [ ] `/p/[slug]`: mobile tree with `FeedStoryMedia`, `Accordion` details, bought-together rail, sticky add bar
- [ ] Pagination: mobile shows a **"Load more" link** appending `?page=n`, not an
      IntersectionObserver fetch loop. Mark it
      `// ponytail: load-more link, swap for IntersectionObserver if the page-jump reads badly`
- [ ] Gate: `pnpm build`

### Phase 5 — Transactional screens
- [ ] `mobile-bag-list.tsx` + `/cart` mobile tree (qty steppers, pinned totals)
- [ ] `mobile-checkout-steps.tsx` + `/checkout` mobile tree over the existing sections
- [ ] `/checkout/result`, `/login`, `/register` mobile styling
- [ ] `mobile-order-card.tsx` + `/account/orders`; `/account/settings` mobile sections
- [ ] `mobile-info-tabs.tsx` + the four `(legal)` pages
- [ ] Gate: `pnpm lint && pnpm test && pnpm build`

### Phase 6 — Close out
- [ ] `docs/codebase-summary.md` + `docs/system-architecture.md`: the mobile IA,
      the breakpoint-split rule, the new `/wall` route
- [ ] `README.md`: replace the "Header/footer/menu mobile hardcodes 3 links"
      paragraph — the Wall now exposes all 7 collections, which closes that gap
- [ ] `docs/ui-flow-mobile.html`: refresh to the new IA
- [ ] `code-reviewer` agent over the diff

---

## Verification

**Automated**
```bash
pnpm lint
pnpm test                 # incl. the new feed-interleave test
pnpm build                # type + RSC boundary errors surface here
```

**Schema**
```bash
pnpm prisma migrate status
# or via Supabase MCP: list_tables → Category shows tagline, heroMediaUrl
```

**Manual walkthrough** — `pnpm dev`, then the dev preview toggle (bottom-left
`Code2` button) set to **mobile (390px)**, or a real phone viewport:

1. `/` — slides snap one-per-swipe; story bars advance on left/right taps;
   size chip → add-to-bag → toast + badge increments; every 4th slide is a
   collection reel with a real 3-product strip; swipe right → `/wall`.
2. `/wall` — stats match the DB (pieces/collections), highlight circles list all
   7 categories, tiles are 3-col with real prices, tabs filter.
3. `/c/new-arrivals` — chips open the sheet; applying a size writes the same
   query param the desktop sidebar writes (`?size=S`); "Show N pieces" count is
   real; Load more appends page 2.
4. `/search?q=coat` — results, recent queries persist across reloads.
5. `/p/<slug>` — gallery pages, accordion opens, sticky bar adds the selected
   size, bought-together rail is populated (demo history exists).
6. `/cart → /checkout → place COD order → /checkout/result → /account/orders` —
   totals agree end to end, the new order appears with the right progress step.
7. Resize to `≥ lg` — the **current desktop storefront is byte-for-byte the old
   design**, except the hamburger is gone (desktop never showed it) and `/wall`
   is a new page.
8. Tab-bar safe area: no content hidden behind the bar on any screen; the FAQ
   widget does not overlap it.

**Accessibility (do not simplify away)** — every tap target ≥ 44px as the design
specifies; tap zones get real `<button>`s with labels; `aria-current="page"` on
the active tab; the swipe-right gesture always has the visible "Wall" affordance
beside it; `aria-live` on the stock warning (already in
`product-purchase-panel.tsx:102`).

---

## Out of scope / deferred

- Product video (9:16 clips) and any `ProductImage.kind` column — decision 2.
- x/y pinned product hotspots on collection films — decision 1.
- True infinite scroll — Load more link ships first.
- Share sheet beyond `navigator.share` with a copy-link fallback.
- Colour facet swatches — render only if colour variants get seeded.
- Admin CRUD for `tagline` / `heroMediaUrl` (`components/admin/product-form.tsx`
  has no category editor today; seed is the authoring path).
- Desktop redesign of any kind.

## Open questions

None. The two that were open are resolved as decisions 4 and 5 above.
