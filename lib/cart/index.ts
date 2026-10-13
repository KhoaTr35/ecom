import { prisma } from "@/lib/db";
import { calculatePrice } from "@/lib/pricing";
import { buildPriceContext } from "@/lib/pricing/context";

export async function quoteGuestCart(items: { variantId: string; qty: number }[], now: Date) {
  const ctx = await buildPriceContext(items.map((i) => i.variantId));
  return calculatePrice({ items, segment: "GUEST", now }, ctx);
}

export function getCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: { items: { include: { variant: true } } },
  });
}

export async function upsertCartItem(userId: string, variantId: string, qty: number) {
  const cart = await prisma.cart.upsert({ where: { userId }, create: { userId }, update: {} });
  const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  const clampedQty = Math.max(0, Math.min(qty, variant.stock));

  if (clampedQty === 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  } else {
    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      create: { cartId: cart.id, variantId, qty: clampedQty },
      update: { qty: clampedQty },
    });
  }

  return getCart(userId);
}

export async function removeCartItem(userId: string, variantId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id, variantId } });
  return getCart(userId);
}

export async function syncGuestCart(userId: string, guestItems: { variantId: string; qty: number }[]) {
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: { items: true },
  });

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: guestItems.map((i) => i.variantId) } },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));

  for (const guestItem of guestItems) {
    const variant = variantById.get(guestItem.variantId);
    if (!variant) continue; // variant no longer exists — drop it

    const existing = cart.items.find((i) => i.variantId === guestItem.variantId);
    const qty = Math.min((existing?.qty ?? 0) + guestItem.qty, variant.stock);

    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: guestItem.variantId } },
      create: { cartId: cart.id, variantId: guestItem.variantId, qty },
      update: { qty },
    });
  }

  return getCart(userId);
}
