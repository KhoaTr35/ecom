import "dotenv/config";
import { prisma } from "../lib/db";
import { auth } from "../lib/auth";
import seedData from "./seed-data.json";

async function resetBusinessData() {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
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

async function main() {
  await resetBusinessData();
  const categoryIdBySlug = await seedCategories();
  await seedProducts(categoryIdBySlug);
  await seedShippingAndPricing();
  await seedDemoAccounts();
  console.log("Seed hoàn tất.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
