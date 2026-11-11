import { prisma } from "../lib/db";
import type { Prisma } from "../lib/generated/prisma/client";

/**
 * Synthetic history for the admin dashboards. Split out of `seed.ts` because
 * this is the only part that exists purely to make charts look alive — the
 * catalogue/account seeding next door is real demo content.
 *
 * Everything here is deterministic (index arithmetic, no `Math.random`) so
 * every teammate's reseed produces an identical dashboard.
 */

/** Matches the admin analytics page's default range (last 30 days). */
const DAYS = 30;
const DAY_MS = 86_400_000;

/** Statuses `lib/analytics` counts as revenue (getKpis / getDailyRevenue). */
const REVENUE_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
/** Non-revenue statuses, so every /admin/orders status filter returns rows. */
const OTHER_STATUSES = ["PENDING_CONFIRM", "CANCELLED"] as const;
/**
 * `lib/recommend`'s boughtTogether only counts orders with status PAID or
 * DELIVERED. Co-purchase pair orders must therefore use one of these two, or
 * the "Frequently bought together" signal silently disappears and the PDP
 * falls back to the same-category list.
 */
const PAIR_STATUSES = ["DELIVERED", "PAID"] as const;

/** Historical orders so the orders list, KPI tiles, revenue chart and
 * "Frequently bought together" all have something to show on a fresh seed.
 * Deliberately does not touch `ProductVariant.stock`: these are past records,
 * not live reservations, so seeded stock stays what seed-data.json declares. */
export async function seedOrderHistory() {
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { email: "asc" } });
  const variants = await prisma.productVariant.findMany({ include: { product: true } });
  const shippingMethods = await prisma.shippingMethod.findMany();
  if (customers.length === 0 || variants.length === 0 || shippingMethods.length === 0) return 0;

  const bySlug = (slug: string) => variants.find((v) => v.product.slug === slug)!;
  // Two fixed pairs repeated across several orders so the co-occurrence
  // ranking has a real signal rather than always falling back to category.
  const pairs = [
    [bySlug("oversized-wool-coat"), bySlug("wide-leg-trousers")],
    [bySlug("silk-slip-dress"), bySlug("gold-hoop-earrings")],
  ];

  const now = new Date();
  let orderIndex = 0;

  for (let day = 0; day < DAYS; day++) {
    // 2–3 orders per day => ~70 orders, enough that the revenue chart reads as
    // a trend rather than isolated spikes.
    const ordersToday = day % 3 === 0 ? 3 : 2;
    // Every 5th day carries a co-purchase pair order.
    const isPairDay = day % 5 === 0;
    // A few days deliberately have no revenue-bearing order, so the chart has
    // some natural variation instead of a suspiciously uniform floor.
    const dayHasRevenue = day % 8 !== 7 || isPairDay;

    for (let slot = 0; slot < ordersToday; slot++) {
      const isPairOrder = isPairDay && slot === 0;

      let status: string;
      if (isPairOrder) {
        status = PAIR_STATUSES[Math.floor(day / 5) % PAIR_STATUSES.length];
      } else if (slot === 0) {
        // First order of the day drives the daily revenue bar.
        status = dayHasRevenue
          ? REVENUE_STATUSES[day % REVENUE_STATUSES.length]
          : OTHER_STATUSES[day % OTHER_STATUSES.length];
      } else {
        // Later slots mix both kinds so filters and funnel stay populated.
        status = (orderIndex + slot) % 4 === 3
          ? OTHER_STATUSES[orderIndex % OTHER_STATUSES.length]
          : REVENUE_STATUSES[(orderIndex + slot) % REVENUE_STATUSES.length];
      }

      const customer = customers[orderIndex % customers.length];
      const method = shippingMethods[orderIndex % shippingMethods.length];
      // Spread within the day so same-day orders don't share a timestamp.
      const createdAt = new Date(now.getTime() - (DAYS - day) * DAY_MS + slot * 3 * 3_600_000);

      const chosen = isPairOrder
        ? pairs[Math.floor(day / 5) % pairs.length].map((v) => ({ variant: v, qty: 1 }))
        : [{ variant: variants[(orderIndex * 3 + slot) % variants.length], qty: 1 + ((day + slot) % 2) }];

      const subtotal = chosen.reduce((sum, { variant, qty }) => sum + variant.basePrice * qty, 0);
      const shippingFee = method.freeFrom != null && subtotal >= method.freeFrom ? 0 : method.fee;
      const total = subtotal + shippingFee;

      await prisma.order.create({
        data: {
          code: `ORD-SEED-${orderIndex.toString().padStart(3, "0")}`,
          userId: customer.id,
          status: status as never,
          paymentMethod: orderIndex % 2 === 0 ? "COD" : "VNPAY",
          shippingMethodCode: method.code,
          subtotal,
          discount: 0,
          shippingFee,
          total,
          addressSnapshot: {
            recipient: customer.name,
            phone: "0900000000",
            line: "123 Demo Street",
            ward: "Ward 1",
            province: "Ho Chi Minh City",
          },
          pricingSnapshot: {
            lines: chosen.map(({ variant, qty }) => ({
              variantId: variant.id,
              name: variant.product.name,
              qty,
              unitBase: variant.basePrice,
              unitFinal: variant.basePrice,
              lineTotal: variant.basePrice * qty,
            })),
            subtotal,
            discount: 0,
            shippingFee,
            total,
          },
          createdAt,
          items: {
            create: chosen.map(({ variant, qty }) => ({
              variantId: variant.id,
              nameSnapshot: variant.product.name,
              unitPrice: variant.basePrice,
              qty,
            })),
          },
        },
      });

      orderIndex++;
    }
  }

  return orderIndex;
}

/** Sessions per day, cycled so volume varies without randomness.
 * Averages ~11/day => ~330 "Visits" over the default 30-day range. */
const SESSIONS_PER_DAY = [9, 12, 8, 14, 10, 11, 13, 9, 15, 10];

/**
 * Funnel depth thresholds, as a count out of 200 sessions. Nested by
 * construction (a purchasing session also has every shallower event), so the
 * data stays coherent rather than showing purchases without add-to-cart:
 *
 *   100% page_view -> 45% product_view -> 18% add_to_cart
 *                  -> 8% begin_checkout -> 2.5% purchase
 *
 * 2.5% purchase against 100% page_view puts the dashboard's conversion rate
 * at a believable ~2.5%, instead of the 10% the old one-session-per-day
 * pattern produced.
 */
const FUNNEL_SCALE = 200;
const REACHES_PRODUCT_VIEW = 90;
const REACHES_ADD_TO_CART = 36;
const REACHES_BEGIN_CHECKOUT = 16;
const REACHES_PURCHASE = 5;

/** Historical analytics events so the "Visits" tile and funnel chart aren't
 * stuck at 0 on a fresh seed — real events are only recorded after a visitor
 * accepts the cookie-consent banner, which a fresh seed has none of. */
export async function seedAnalyticsEvents() {
  const products = await prisma.product.findMany({ orderBy: { slug: "asc" } });
  if (products.length === 0) return 0;

  const now = new Date();
  const events: { type: string; sessionId: string; createdAt: Date; payload?: Record<string, unknown> }[] = [];
  let sessionIndex = 0;

  for (let day = 0; day < DAYS; day++) {
    const sessionsToday = SESSIONS_PER_DAY[day % SESSIONS_PER_DAY.length];

    for (let s = 0; s < sessionsToday; s++) {
      const sessionId = `seed-session-${day}-${s}`;
      // Spread sessions through the day rather than stacking them on midnight.
      const createdAt = new Date(now.getTime() - (DAYS - day) * DAY_MS + (s % 24) * 3_600_000);
      // *7 is coprime with 200, so this walks every residue exactly once per
      // cycle — same ratios as a plain counter, but deep-funnel sessions are
      // scattered across days instead of clumping at the start of each block.
      const depth = (sessionIndex * 7) % FUNNEL_SCALE;

      events.push({ type: "page_view", sessionId, createdAt });
      if (depth < REACHES_PRODUCT_VIEW) {
        const product = products[sessionIndex % products.length];
        events.push({ type: "product_view", sessionId, createdAt, payload: { path: `/p/${product.slug}` } });
      }
      if (depth < REACHES_ADD_TO_CART) events.push({ type: "add_to_cart", sessionId, createdAt });
      if (depth < REACHES_BEGIN_CHECKOUT) events.push({ type: "begin_checkout", sessionId, createdAt });
      if (depth < REACHES_PURCHASE) events.push({ type: "purchase", sessionId, createdAt });

      sessionIndex++;
    }
  }

  await prisma.analyticsEvent.createMany({ data: events as Prisma.AnalyticsEventCreateManyInput[] });
  return events.length;
}
