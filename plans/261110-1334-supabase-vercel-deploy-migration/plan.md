# Migrate database to Supabase

Goal (single goal): stop depending on the local Docker Postgres container,
make Supabase the one and only database for the whole project — local dev,
teammates, and later the Vercel deploy — and confirm every connection is
healthy from localhost over IPv4, with seed data rich enough that the admin
analytics dashboard reads as a working dashboard.

Vercel deployment itself is **out of scope** (design not finalized); this plan
only leaves the path ready — see section 6.

## Decisions locked in (10/11/2026)

| Decision | Value |
| --- | --- |
| Supabase project | `pjelkjclqgmuzbhizski` ("ecom"), `ap-southeast-1` (Singapore), Postgres 17, `ACTIVE_HEALTHY` — verified via MCP, only project in the org |
| Environments | **One database, one view.** No local/preview/production split. Teammates and the eventual Vercel deploy all share this project |
| Connectivity | IPv4 only, **no direct connection** — both Prisma URLs go through the shared pooler (section 1) |
| Seed behaviour | Stays destructive (wipes before reload). README must warn about it |
| Seed volume | Enriched so the analytics dashboard looks functional (section 3) |
| VNPay | No real sandbox transactions. COD is the demo payment path; VNPay is future work |

## 0. Hard boundaries — read before touching any tool

Supabase org is on the Free Plan with no payment method attached — overage
means service restriction (read-only/pause), not a bill. The real risks are
flipping something billable, or destroying shared data. An agent following
this plan must not, under any circumstances:

- [ ] Call `create_project`, `create_branch`, or `restore_project` without
      first calling `get_cost`, showing the number to the user, and getting
      an explicit yes. Default is **don't** — this plan only ever touches
      `pjelkjclqgmuzbhizski`.
- [ ] Touch Supabase Project Settings → Add-ons (Compute upgrade, PITR,
      Custom Domain, **IPv4 address**, Log Drains, Advanced MFA) or
      Organization billing. The IPv4 add-on exists to make the *direct*
      connection IPv4-reachable — this plan avoids the direct connection
      entirely instead, so the add-on is never needed.
- [ ] Run `pnpm db:migrate` (`prisma migrate dev`) against Supabase. It is an
      interactive dev command that can decide the remote DB has drifted and
      offer to **reset** (drop) it, and it wants shadow-database privileges.
      Remote gets `pnpm db:deploy` (`migrate deploy`) only. Never
      `prisma migrate reset` against Supabase.
- [ ] Run `pnpm db:seed` against Supabase without warning the user first.
      `prisma/seed.ts` opens with `deleteMany()` across **12** tables
      (`orderItem`, `payment`, `order`, `analyticsEvent`, `cartItem`, `cart`,
      `productImage`, `productVariant`, `product`, `category`,
      `shippingMethod`, `priceRule`). **This database is shared with
      teammates** — a careless seed destroys their work, not just yours.
      Note it does *not* clear `User`/`Session`/`Address`/`AuditLog`, so demo
      accounts and addresses survive a reseed while their orders do not.
- [ ] Run bulk writes, load tests, or repeated reseed loops against Supabase
      — stay under the free-tier 500MB DB size and 10GB/month egress. There
      are currently **no integration tests** (`vitest.config.mts` includes
      only `tests/unit/**`, which never touch a DB); when they get written,
      point them at local Docker, not Supabase.
- [ ] Print the DB password, service-role key, or any connection string
      containing a real password into chat. `.env` is gitignored (verified);
      `.env.example` is tracked — real values go in `.env` only.

If a step below seems to require crossing one of these lines, stop and ask.

## 1. Connection strings — IPv4 pooler for both, no direct connection — DONE

**Resolved values (verified by connecting, 10/11/2026):**

| | Host | Port | Mode |
| --- | --- | --- | --- |
| `DATABASE_URL` | `aws-1-ap-southeast-1.pooler.supabase.com` | 6543 | transaction |
| `DIRECT_URL` | `aws-1-ap-southeast-1.pooler.supabase.com` | 5432 | session |

Username `postgres.pjelkjclqgmuzbhizski`. Cluster is **`aws-1`**, not `aws-0` —
both resolve to IPv4 but only `aws-1` accepts this project's credentials;
determined by trying both, don't assume. DNS confirms the direct host
`db.pjelkjclqgmuzbhizski.supabase.co` has **no A record, AAAA only** — the
IPv6-only claim is verified for this specific project, not just doc-level.

`DATABASE_URL` additionally needs **`?uselibpqcompat=true&sslmode=require`**.
`node-postgres` >= 8.23 (this repo has ^8.23.1) changed plain
`sslmode=require` to do full certificate verification, which fails against the
pooler's self-signed CA chain (`Error opening a TLS connection: self-signed
certificate in certificate chain`). `uselibpqcompat=true` restores libpq
semantics — encrypt without verifying the chain, same as psql's
`sslmode=require`. `DIRECT_URL` is consumed by the Prisma CLI, which connects
fine on plain `?sslmode=require`; the asymmetry is intentional.

Trade-off accepted: traffic is encrypted but the server certificate is not
authenticated. Full verification would need Supabase's CA cert downloaded and
distributed to every teammate plus the deploy env. Revisit if this ever
carries real customer data.

<details>
<summary>Original pre-flight steps (kept for reference)</summary>

On the free tier the direct connection (`db.<ref>.supabase.co:5432`) is
**IPv6-only**; IPv4 there requires the paid add-on. Both shared-pooler
endpoints are IPv4 on every tier, so routing both Prisma URLs through the
pooler satisfies "IPv4 only, no direct connection" with zero code change.

| Purpose | Supabase mode | Host:port | IP |
| --- | --- | --- | --- |
| `DATABASE_URL` — app runtime | Pooler, transaction mode | `aws-<region>.pooler.supabase.com:6543` | IPv4 |
| `DIRECT_URL` — Prisma CLI / migrations | Pooler, **session** mode | `aws-<region>.pooler.supabase.com:5432` | IPv4 |

Session mode is a real Postgres session (supports DDL, prepared statements,
`pg_dump`), so `migrate deploy` is safe through it — transaction mode is not.

- [ ] Copy both strings from Supabase dashboard → **Connect** for project
      `pjelkjclqgmuzbhizski`. Copy, don't hand-build: the pooler username is
      `postgres.pjelkjclqgmuzbhizski`, not `postgres`, and the region prefix
      format changes.
- [ ] Append `?sslmode=require` to both. URL-encode the password if it
      contains `@ # / : ?` or similar.
- [ ] Do **not** add `?pgbouncer=true` — verified no-op here, see "Verified
      decisions" below.

</details>

## 2. Point the app at Supabase — DONE

- [x] Edit `.env` (not `.env.example`): `DATABASE_URL` = transaction pooler,
      `DIRECT_URL` = session pooler. Password read from the staged
      `DATABASE_PASSWORD` var, URL-encoded (it contains characters that
      required encoding), never echoed. No code change needed — the
      `lib/db.ts` / `prisma.config.ts` split already existed.
- [x] `.env.example` left pointing at Docker for the zero-config fresh clone,
      but its comments now document the Supabase pooler form, the
      `uselibpqcompat` gotcha, and that `DATABASE_PASSWORD` is not read by any
      code (it only feeds URL assembly).
- [x] `pnpm db:deploy` — `20261010085732_init` applied cleanly through the
      session pooler. Confirmed via MCP `list_tables`: 20 tables in `public`.
      `_prisma_migrations` now holds **2** rows (`…_init` plus the RLS
      migration from section 2b); `prisma migrate status` reports "Database
      schema is up to date" with no drift.
- [x] `pnpm db:seed` — run once, after section 3's enrichment, so no second
      destructive reseed was needed. Result: 70 orders, 584 analytics events.
- [x] README now carries the destructive-seed warning the decisions table
      requires (a `[!WARNING]` callout naming all 12 wiped tables, the four
      that survive, and that the DB is shared).

## 2b. Security finding — RLS disabled on all 20 tables — RESOLVED

**Fixed 10/11/2026** as a Prisma migration, not an out-of-band MCP call, so
the hardening lives in the repo and survives the project being recreated:
`prisma/migrations/20261110155500_enable_row_level_security/migration.sql`.
Applied with `pnpm db:deploy`. The user also enabled RLS by hand in the
dashboard around the same time — the two converged harmlessly, since
`ENABLE ROW LEVEL SECURITY` is idempotent, and the migration remains the
reproducible source of truth. Prisma reports no drift (RLS is not expressed
in `schema.prisma`, so there is nothing for it to diff).

**Verification (strongest evidence last):**

| Check | Result |
| --- | --- |
| Tables with `relrowsecurity` | 20 / 20 |
| Policies defined | 0 (intentional) |
| `relforcerowsecurity` | `false` on all 20 — **load-bearing**, see below |
| `anon` reading `Product` / `User` / `Order` | **0 / 0 / 0 rows** |
| App write path after RLS | create / read / `$transaction` / rollback / delete all OK |
| Supabase advisor `rls_disabled` (CRITICAL) | cleared |

The role-impersonation test (`begin; set local role anon; select …`) is the
one that actually proves the exposure is closed; the flags alone only prove a
setting was toggled.

**`relforcerowsecurity` must stay `false`.** `FORCE ROW LEVEL SECURITY` applies
RLS to the table owner too, which would defeat the `BYPASSRLS` this design
relies on — every Prisma query would silently return zero rows rather than
erroring. Noted in the migration file as well.

**The advisor now reports `rls_enabled_no_policy` (INFO) on all 20 tables.
That is expected, not a defect** — Supabase's linter assumes you serve tables
through its Data API, where no policies means nobody can read. Here the app
connects as `postgres` with `BYPASSRLS`, so zero policies is exactly the
intent: app unrestricted, `anon`/`authenticated` denied everything. Do not
"fix" it by writing policies.

Still open (dashboard-only, no MCP tool exists): optionally disable the
unused Data API in Project Settings → API. RLS already closes the hole, so
this is belt-and-braces.

<details>
<summary>Original finding, for the record (state before the fix)</summary>

Surfaced by Supabase's own advisor after the initial migration, and confirmed
directly:

- `anon` and `authenticated` both held `SELECT/INSERT/UPDATE/DELETE/TRUNCATE`
  on all 20 `public` tables (those grants still exist — RLS is what now
  blocks them).
- RLS was **off** on every one of them.
- Net effect: anyone holding the project's anon key could read or modify every
  row — including `User`, `Session`, `Account`, `Address`, `Order`, `Payment`.
  Supabase treats the anon key as publishable (it normally ships in browser
  bundles), so it is not a secret.

This project never calls the Supabase Data API — all access is Prisma over the
Postgres protocol — so that exposure buys nothing and costs real risk, on a
database that is shared with teammates and will back the deploy.

**Enabling RLS is safe here, verified not assumed:** Prisma connects as
`postgres`, and `select rolbypassrls from pg_roles where rolname =
current_user` returns `t`. RLS would lock out `anon`/`authenticated` while the
app keeps full access with no policies written.

- [x] Enable RLS on all 20 tables; no policies needed given the verified
      bypass. Reversible with `DISABLE ROW LEVEL SECURITY`. **Applied** — SQL
      below is what shipped in the migration file.

```sql
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Account"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Verification"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Jwks"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Address"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Category"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Product"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductVariant"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductImage"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Cart"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CartItem"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShippingMethod"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PriceRule"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AnalyticsEvent"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AuditLog"           ENABLE ROW LEVEL SECURITY;
```

- [x] After applying, re-run section 4's write check — done, all five
      operations still OK, so the `rolbypassrls` reasoning held in practice.

</details>

- [ ] **Also worth doing:** turn off / restrict the Data API in Project
      Settings → API, since nothing in this project uses it. Belt and braces
      with RLS; either alone closes the hole. **Dashboard-only** — the
      Supabase MCP server has no tool for API/exposed-schema config.

## 3. Enrich seed data so the analytics dashboard looks functional — DONE

**Implemented 10/11/2026.** `prisma/seed.ts` was 195 lines and would have
passed the repo's ~200-line guideline, so the synthetic-history generators
moved to **`prisma/seed-demo-history.ts`** (`seedOrderHistory`,
`seedAnalyticsEvents`); `seed.ts` is now 88 lines and keeps the real demo
content (catalogue, shipping, pricing, accounts). Typecheck and lint clean,
46 unit tests still pass.

Seeded against Supabase: **70 orders, 584 analytics events.** Measured
results vs. the targets below:

| Dashboard element | Before | After | Target | |
| --- | --- | --- | --- | --- |
| Visits | 30 | **332** | 300–450 | ✓ |
| Conversion rate | 10% | **2.11%** | 2–3% | ✓ |
| Funnel (sessions) | 18→9→6→3 | **153→61→26→7** | realistic decay | ✓ |
| Orders | 18 | **70** | 60–80 | ✓ |
| Days with revenue | ~12/30 | **29/30** | ≥80% | ✓ |
| `boughtTogether`-eligible orders | 3 | **26** | signal preserved | ✓ |
| Revenue / AOV | — | 208.980.000 ₫ / 3.666.316 ₫ | plausible | ✓ |

All five `/admin/orders` status groups populated: PAID 19, PROCESSING 16,
SHIPPED 16, PENDING_CONFIRM 7, DELIVERED 7, CANCELLED 5.

**Non-obvious constraint discovered while implementing:** `lib/recommend`'s
`boughtTogether` filters `status in ('PAID','DELIVERED')` — *not* the four
revenue statuses. The old seed's pair orders landed on `PROCESSING` half the
time, so only 3 of 6 actually fed the recommender; it worked by luck. The new
generator forces pair orders onto `PAID`/`DELIVERED` explicitly, with a
comment, because getting this wrong makes "Frequently bought together"
silently degrade to the same-category fallback rather than fail visibly.

DB size after seeding: **12 MB — 2.34% of the free-tier 500 MB cap.**

<details>
<summary>Original targets and analysis</summary>

`/admin/analytics` defaults to a 30-day range and reads from `lib/analytics`
(`getKpis`, `getFunnel`, `getDailyRevenue`). Current seed is too thin to read
as real — measured against that default range:

| Dashboard element | Current seed result | Problem |
| --- | --- | --- |
| Visits | 30 (one session/day, `seed-session-<day>`) | a shop with 1 visitor/day |
| Conversion rate | 3 purchase sessions / 30 visits = **10%** | implausible; real e-commerce is 1–3% |
| Revenue trend | 18 orders, only 12 in revenue-counting statuses, spread over 30 days | ~18 of 30 days are zero — chart reads as gaps, not a trend |
| Funnel | 18 → 9 → 6 → 3 sessions | shape is right, magnitude is tiny |

- [ ] Raise analytics volume in `seedAnalyticsEvents()`: multiple sessions
      per day (target ~8–15) across 30 days, so Visits lands in the
      300–450 range instead of 30.
- [ ] Retune funnel ratios to a believable decay — roughly 100% `page_view`
      → ~45% `product_view` → ~18% `add_to_cart` → ~8% `begin_checkout`
      → ~2.5% `purchase`, which also drags conversion rate from 10% down to
      a realistic 2–3%.
- [ ] Raise `ORDER_COUNT` in `seedOrderHistory()` (target ~60–80) and
      distribute `createdAt` so **at least ~80% of days carry one
      revenue-counting order** (`PAID`/`PROCESSING`/`SHIPPED`/`DELIVERED`)
      — that is what makes `getDailyRevenue`'s chart look like a trend.
- [ ] Preserve two existing behaviours while changing volume:
      - the two fixed co-purchase pairs (wool coat + wide-leg trousers; silk
        slip dress + gold hoop earrings) that give `lib/recommend`'s
        "Frequently bought together" a real signal instead of a fallback.
        Verified all four slugs exist in `seed-data.json`;
      - all five status groups present, so `/admin/orders` filters each
        return something.
- [ ] Keep it deterministic. Verified `prisma/seed.ts` currently uses no
      `Math.random()` / `randomUUID` / faker — every teammate's reseed
      produces an identical dashboard today. **Don't regress this** while
      adding volume; use index arithmetic, not randomness.
- [ ] Sanity-check size after seeding — a few hundred rows is kilobytes,
      nowhere near the 500MB cap, but confirm rather than assume.
- [ ] Verify by eye: load `/admin/analytics` and confirm Visits, conversion
      rate, funnel, and the revenue trend all read as plausible.

**Constraint found during review:** `seed-data.json` has only **14 products**
(the master plan's IMP-29 targeted 40–60, never delivered). `product_view`
variety is therefore capped at 14 distinct products, and
`seedOrderHistory`'s line items cycle through a small variant pool. That is
enough for the dashboard to look alive, but if the catalogue itself looks
thin during the demo, the fix is more `seed-data.json` entries, not more
events — out of scope for this runbook.

</details>

## 4. Verify every connection is healthy from localhost

The actual deliverable. Do not stop at "commands exited 0" — this codebase is
built to look healthy while the DB is broken: `lib/catalog/index.ts` catches
query errors and silently returns `mockProducts`/`mockCategories`, and
`PrismaPg` with an unset `DATABASE_URL` quietly falls back to libpq defaults
(localhost). A homepage full of products proves nothing on its own.

- [x] Confirm rows are really in Supabase, independent of the app — done via
      MCP `list_tables` (20 tables, `_prisma_migrations` = 2 rows). Re-run
      after seeding to check `Product` / `AnalyticsEvent` counts.
- [x] Prove a **write** through `lib/db.ts` on the runtime (`:6543`) path —
      done: create, read-back, interactive `$transaction` + conditional
      `updateMany`, rollback, delete all OK. This is the pattern
      `lib/order/placeOrder` depends on, so transaction pooling is cleared.

**How to tell DB-backed from mock — the slug test does NOT work.**
`lib/mock-data.ts` is *derived from* `prisma/seed-data.json` (it maps over the
same `categories`/`products`), so **every seeded slug is also a mock slug**.
A product page renders identically whether the DB works or not; a 404-based
check can never fire. Use these instead:

- [x] **ID prefix (decisive, read-only).** Mock IDs are literal strings —
      `mock-prod-N`, `mock-cat-N`, `mock-var-N-M`; real ones are `cuid()`.
      Confirmed two ways: `getProductBySlug("oversized-wool-coat")` returns
      `id=cmwagxmw10007vbit1j9ho5dl` (a real cuid), and the server-rendered
      PDP markup contains **0** occurrences of `mock-var-`/`mock-prod-`.
- [x] `pnpm dev` + HTTP: homepage **200**, `/p/oversized-wool-coat` **200**,
      and both recommendation sections render ("Frequently bought together"
      *and* "You may also like") — so IMP-40's co-purchase path is live on
      real data, not the fallback.
- [x] **Admin analytics helpers** return real figures (`getKpis` /
      `getFunnel` called directly): visits 332, conversion 2.11%, orders 57,
      revenue 208.980.000 ₫, funnel 153→61→26→7, no zero tiles. Note the
      *page* wraps each call in `.catch()` returning zeros — so all-zero
      tiles would mean the query failed, not that data is missing.
- [x] COD order + stock-hold round trip through `lib/order.placeOrder`:
      `BAG-CROSS-TAN` stock 12 → 11 on order (status `PENDING_CONFIRM`),
      restored to 12 on cancel via `transitionOrder`. Test order, cart and
      address cleaned up afterwards — order count back to the seeded 70.
- [x] `pnpm test` — green before and after the seed refactor (4 files, 46
      tests). Unit only, no DB, so **not** connection evidence; just a
      regression guard.
- [x] Project health after seeding: `get_advisors` (health) returns **no
      lints**; DB size 12 MB = 2.34% of the 500 MB free-tier cap.

Left for you (needs a browser session, can't be done headlessly):

- [ ] Sign in through the UI as `admin@atelier.test` and eyeball
      `/admin/analytics` and `/admin/orders`. The underlying numbers are
      verified above, so this is a visual/UX check — does the dashboard
      *look* credible — plus confirmation that role-gating behaves in a real
      session.
- [x] Local Docker isolation — `docker compose ps` shows **nothing running**,
      so there is no local Postgres to accidentally succeed against. Anything
      working now is necessarily Supabase. (If you later start Docker for
      test work, re-confirm `.env` still points at the pooler.)

## 5. Rollback

Nothing in `lib/` or `app/` was modified, so rollback is a config change plus
one awareness note: section 2b **did** add
`prisma/migrations/20261110155500_enable_row_level_security/`. That migration
is harmless on local Docker (the `anon`/`authenticated` roles do not exist
there, the SQL never names them, and the local `postgres` superuser bypasses
RLS), so it needs no special handling — do **not** delete it, or the Supabase
project loses its hardening on the next rebuild.

- [ ] Copy the Docker defaults back into `.env` from **`.env.example`**
      (still Docker-shaped on purpose — `postgresql://postgres:postgres@
      localhost:5432/ecom?sslmode=disable` for both URLs), then
      `docker compose up -d`, `pnpm db:migrate`, `pnpm db:seed`, and confirm
      the homepage renders plus one write succeeds.
      (The earlier "save the current values first" step turned out to be
      unnecessary — the Docker values were never anything but the committed
      `.env.example` defaults.)
- [ ] Do not delete the Supabase project — deletion is irreversible and it is
      now the shared source of truth for the team.

## 6. Leave the Vercel path ready (do not execute)

Deploy design isn't final, so this section is preparation only — no Vercel
project, no deploy.

- [ ] Nothing to change for Vercel's sake: transaction-mode pooling is
      already the right choice for serverless/edge-style request patterns,
      and it is what `DATABASE_URL` will already be set to.
- [ ] Record the env vars a future deploy will need, so it is a copy-paste
      job later: `DATABASE_URL`, `DIRECT_URL` (same pooler values),
      `APP_URL` + `BETTER_AUTH_URL` (deployment URL),
      `BETTER_AUTH_SECRET` (**generate a fresh one** —
      `openssl rand -base64 32` — never the committed dev placeholder).
      `BLOB_READ_WRITE_TOKEN` stays unset (admin images are URL-based, not
      wired to Vercel Blob). VNPay vars stay unset — out of scope.
- [ ] Note for whoever does the deploy: because there is one shared database,
      a Vercel deploy writes to the **same** rows as local dev. There is no
      preview/production isolation by design.

## 7. If something trips a free-tier limit

- [ ] Database read-only (>500MB): don't upgrade the plan — check
      `select pg_size_pretty(sum(pg_database_size(datname))) from pg_database;`,
      vacuum or trim seed data, ask before anything billable.
- [ ] Project auto-paused from inactivity: free and harmless, no data loss —
      unpause from the dashboard (or `restore_project` after confirming).
      Worth doing a few minutes before any demo.
- [ ] Egress climbing: find what's hammering it (repeated seed/test runs
      against Supabase instead of Docker is the likely cause) before
      considering any paid option.
- [ ] Runtime errors mentioning prepared statements / `bind message supplies
      N parameters`: switch `DATABASE_URL` from transaction mode (6543) to
      session mode (5432). Expected unnecessary — see below.

## Verified decisions (don't re-litigate without new evidence)

- **`?pgbouncer=true` is a no-op in this codebase.** It is a flag for
  Prisma's Rust query engine; this project uses the driver adapter instead
  (`lib/db.ts` → `new PrismaPg({ connectionString })`). Verified that
  `@prisma/adapter-pg` never reads `pgbouncer` from the URL.
- **Prepared statements are already off, so transaction-mode pooling is
  safe.** The adapter only sends a named (prepared) statement when a
  `statementNameGenerator` is configured; `lib/db.ts` passes only
  `connectionString`, so queries go out unnamed. This is why transaction mode
  is correct for `DATABASE_URL` despite Supabase's warning that transaction
  mode can't do prepared statements.
- **The pooler, not the IPv4 add-on, is the answer to IPv6-only direct
  connections** — same capability for this project's needs, zero cost.
- **Prisma stays; Supabase's PostgREST Data API is not adopted.** "IPv4 +
  REST" is already satisfied: the app's own REST layer is `app/api/*`
  (Route Handlers), and it reaches Postgres over the IPv4 pooler. Swapping
  Prisma for PostgREST would mean rewriting every query in `lib/`, losing
  `prisma.$transaction` (which the stock-hold race protection depends on),
  replacing Better Auth's Prisma adapter, and discarding the migrations —
  days of work, days before submission, for no gain against the stated
  requirement.

## Status: COMPLETE — Supabase is the live database

All sections implemented and verified 10/11/2026. The goal is met: the app no
longer depends on local Docker Postgres, Supabase holds the only copy of the
data, every connection is healthy over IPv4, and the analytics dashboard
reads as a working dashboard.

| Section | Outcome |
| --- | --- |
| 1 Connection strings | Pooler `aws-1-ap-southeast-1`, 6543 runtime / 5432 migrations, IPv4 only, no direct connection |
| 2 Point app at Supabase | `.env` + `.env.example` updated, `init` migration applied, README seed warning added |
| 2b RLS | Migration applied; 20/20 tables; `anon` sees 0 rows; CRITICAL advisory cleared |
| 3 Seed enrichment | `seed-demo-history.ts` extracted; 70 orders + 584 events; every dashboard target hit |
| 4 Verification | Real-DB catalogue, HTTP 200s, both recommendation sections, KPIs non-zero, stock-hold round trip OK |
| 5 Rollback | Documented, untested (would require tearing down a working setup) |
| 6 Vercel prep | Env-var list recorded; no Vercel project created, by design |
| 7 Free-tier | 12 MB / 500 MB used; health advisors clean |

Remaining, both optional and neither blocking:

1. **Visual check in a browser** — sign in as `admin@atelier.test` and eyeball
   `/admin/analytics` + `/admin/orders`. The numbers behind them are verified;
   this is a "does it look credible" pass plus real-session role-gating.
2. **Disable the unused Data API** in Supabase dashboard → Settings → API.
   RLS already closes the exposure; this is belt-and-braces. Dashboard-only,
   no MCP tool exists.

Two follow-ups outside this runbook's scope, worth tracking elsewhere:

- **`BETTER_AUTH_SECRET` is a weak dev placeholder** and Better Auth warns
  about it on every seed run ("appears low-entropy", under 32 chars). Harmless
  locally, but this database now holds real sessions and will back the deploy,
  where a guessable secret means forgeable session tokens. Generate a real one
  (`openssl rand -base64 32`) before any deploy — already noted in section 6.
- **Next.js reports a known security vulnerability** in the installed version
  (16.4.0); `pnpm dev` interrupts startup to say so. Upgrade path:
  `next upgrade --agent=security`.
