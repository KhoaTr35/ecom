import "dotenv/config";
import { prisma } from "../lib/db";
import { auth } from "../lib/auth";
import type { Prisma } from "../lib/generated/prisma/client";
import seedData from "./seed-data.json";

async function resetBusinessData() {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.priceRule.deleteMany();
}

async function seedCategories() {
  const bySlug = new Map<string, string>();
  for (const c of seedData.categories) {
    const category = await prisma.category.create({
      data: { slug: c.slug, name: c.name, filters: c.filters },
    });
    bySlug.set(c.slug, category.id);
  }
  return bySlug;
}

async function seedProducts(categoryIdBySlug: Map<string, string>) {
  for (const p of seedData.products) {
    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${p.categorySlug}`);

    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        categoryId,
        description: p.description,
        attributes: p.attributes,
        images: { create: p.images },
        variants: { create: p.variants },
      },
    });
  }
}

async function seedShippingAndPricing() {
  await prisma.shippingMethod.createMany({ data: seedData.shippingMethods });
  await prisma.priceRule.createMany({ data: seedData.priceRules.map((r) => ({ ...r, type: r.type as never })) });
}

async function seedDemoAccounts() {
  for (const account of seedData.demoAccounts) {
    const existing = await prisma.user.findUnique({ where: { email: account.email } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { role: account.role as never } });
      continue;
    }

    const { user } = await auth.api.signUpEmail({
      body: { email: account.email, password: account.password, name: account.name },
    });
    await prisma.user.update({ where: { id: user.id }, data: { role: account.role as never } });
  }
}

/** Historical orders so the admin panel (orders list, KPIs, revenue chart,
 * "Frequently bought together") has something to show on a fresh seed —
 * spread over the last 30 days to match the analytics dashboard's default
 * range. Doesn't touch variant stock: these are past records, not live
 * reservations, so seeded stock levels stay exactly what seed-data.json says. */
async function seedOrderHistory() {
  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" }, orderBy: { email: "asc" } });
  const variants = await prisma.productVariant.findMany({ include: { product: true } });
  const shippingMethods = await prisma.shippingMethod.findMany();
  if (customers.length === 0 || variants.length === 0 || shippingMethods.length === 0) return;

  const bySlug = (slug: string) => variants.find((v) => v.product.slug === slug)!;
  // Two fixed pairs repeated across several orders so `lib/recommend`'s
  // co-occurrence ranking has a real signal instead of always falling back
  // to the same-category list.
  const pairs = [
    [bySlug("oversized-wool-coat"), bySlug("wide-leg-trousers")],
    [bySlug("silk-slip-dress"), bySlug("gold-hoop-earrings")],
  ];

  const STATUS_CYCLE = ["DELIVERED", "DELIVERED", "SHIPPED", "PROCESSING", "PENDING_CONFIRM", "CANCELLED"] as const;
  const ORDER_COUNT = 18;
  const now = new Date();

  for (let i = 0; i < ORDER_COUNT; i++) {
    const customer = customers[i % customers.length];
    const method = shippingMethods[i % shippingMethods.length];
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const createdAt = new Date(now.getTime() - Math.round((i / ORDER_COUNT) * 30) * 86_400_000);

    const items = i % 3 === 0 ? pairs[(i / 3) % pairs.length] : [variants[i % variants.length]];
    const subtotal = items.reduce((sum, v) => sum + v.basePrice, 0);
    const total = subtotal + method.fee;

    await prisma.order.create({
      data: {
        code: `ORD-SEED-${i.toString().padStart(3, "0")}`,
        userId: customer.id,
        status,
        paymentMethod: i % 2 === 0 ? "COD" : "VNPAY",
        shippingMethodCode: method.code,
        subtotal,
        discount: 0,
        shippingFee: method.fee,
        total,
        addressSnapshot: {
          recipient: customer.name,
          phone: "0900000000",
          line: "123 Demo Street",
          ward: "Ward 1",
          province: "Ho Chi Minh City",
        },
        pricingSnapshot: {
          lines: items.map((v) => ({
            variantId: v.id,
            name: v.product.name,
            qty: 1,
            unitBase: v.basePrice,
            unitFinal: v.basePrice,
            lineTotal: v.basePrice,
          })),
          subtotal,
          discount: 0,
          shippingFee: method.fee,
          total,
        },
        createdAt,
        items: {
          create: items.map((v) => ({ variantId: v.id, nameSnapshot: v.product.name, unitPrice: v.basePrice, qty: 1 })),
        },
      },
    });
  }
}

/** Historical analytics events (`lib/analytics`) so the "Visits" KPI and
 * funnel chart aren't permanently 0 on a fresh seed — real usage only
 * records these after a visitor accepts the cookie-consent banner, which a
 * fresh seed obviously has none of. One session per day over the last 30
 * days, repeating a 10-day funnel-depth pattern (100% page_view -> 60%
 * product_view -> 30% add_to_cart -> 20% begin_checkout -> 10% purchase). */
async function seedAnalyticsEvents() {
  const products = await prisma.product.findMany();
  if (products.length === 0) return;

  const now = new Date();
  const days = 30;
  const events: { type: string; sessionId: string; createdAt: Date; payload?: Record<string, unknown> }[] = [];

  for (let day = 0; day < days; day++) {
    const sessionId = `seed-session-${day}`;
    const createdAt = new Date(now.getTime() - (days - day) * 86_400_000);
    const slot = day % 10;

    events.push({ type: "page_view", sessionId, createdAt });
    if (slot < 6) {
      const product = products[day % products.length];
      events.push({ type: "product_view", sessionId, createdAt, payload: { path: `/p/${product.slug}` } });
    }
    if (slot < 3) events.push({ type: "add_to_cart", sessionId, createdAt });
    if (slot < 2) events.push({ type: "begin_checkout", sessionId, createdAt });
    if (slot < 1) events.push({ type: "purchase", sessionId, createdAt });
  }

  await prisma.analyticsEvent.createMany({ data: events as Prisma.AnalyticsEventCreateManyInput[] });
}

async function main() {
  await resetBusinessData();
  const categoryIdBySlug = await seedCategories();
  await seedProducts(categoryIdBySlug);
  await seedShippingAndPricing();
  await seedDemoAccounts();
  await seedOrderHistory();
  await seedAnalyticsEvents();
  console.log("Seed hoàn tất.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
