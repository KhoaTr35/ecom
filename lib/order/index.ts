import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { calculatePrice } from "@/lib/pricing";
import { resolveSegment } from "@/lib/pricing/segment";
import { listShippingMethods } from "@/lib/shipping";

const RESERVATION_MINUTES = 15;

function generateOrderCode(now: Date) {
  return `ORD${now.getTime().toString(36).toUpperCase()}`;
}

export async function releaseExpiredOrders(now: Date) {
  const expired = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: now } },
    include: { items: true },
  });

  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: order.id } });
      if (current?.status !== "PENDING_PAYMENT") return; // already handled

      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.qty } },
        });
      }
      await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    });
  }

  return expired.length;
}

export async function placeOrder(args: {
  userId: string;
  addressId: string | null;
  shippingMethodCode: string;
  paymentMethod: "VNPAY" | "COD";
  now: Date;
}) {
  await releaseExpiredOrders(args.now);

  const cart = await prisma.cart.findUnique({
    where: { userId: args.userId },
    include: { items: true },
  });
  if (!cart || cart.items.length === 0) {
    throw new AppError("VALIDATION_ERROR", "Your cart is empty");
  }

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: cart.items.map((i) => i.variantId) } },
    include: { product: true },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const [shippingMethods, rules, segment] = await Promise.all([
    listShippingMethods(),
    prisma.priceRule.findMany({ where: { active: true } }),
    resolveSegment(args.userId),
  ]);

  const quote = calculatePrice(
    {
      items: cart.items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      segment,
      shippingMethodCode: args.shippingMethodCode,
      now: args.now,
    },
    {
      variants: new Map(
        variants.map((v) => [v.id, { basePrice: v.basePrice, stock: v.stock, categoryId: v.product.categoryId, name: v.product.name }]),
      ),
      rules,
      shippingMethods: shippingMethods.map((m) => ({ code: m.code, fee: m.fee, freeFrom: m.freeFrom })),
    },
  );

  const address = args.addressId
    ? await prisma.address.findUnique({ where: { id: args.addressId } })
    : null;

  const order = await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      const variant = variantById.get(item.variantId);
      if (!variant) throw new AppError("NOT_FOUND", "Product no longer exists");

      const result = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.qty } },
        data: { stock: { decrement: item.qty } },
      });
      if (result.count === 0) {
        throw new AppError("OUT_OF_STOCK", `${variant.product.name} only has ${variant.stock} left in stock`, {
          variantId: item.variantId,
        });
      }
    }

    const isVnpay = args.paymentMethod === "VNPAY";
    const created = await tx.order.create({
      data: {
        code: generateOrderCode(args.now),
        userId: args.userId,
        status: isVnpay ? "PENDING_PAYMENT" : "PENDING_CONFIRM",
        paymentMethod: args.paymentMethod,
        shippingMethodCode: args.shippingMethodCode,
        addressId: args.addressId,
        subtotal: quote.subtotal,
        discount: quote.discount,
        shippingFee: quote.shippingFee,
        total: quote.total,
        addressSnapshot: address ?? {},
        pricingSnapshot: quote,
        expiresAt: isVnpay ? new Date(args.now.getTime() + RESERVATION_MINUTES * 60_000) : null,
        items: {
          create: cart.items.map((item) => {
            const variant = variantById.get(item.variantId)!;
            const line = quote.lines.find((l) => l.variantId === item.variantId)!;
            return {
              variantId: item.variantId,
              nameSnapshot: variant.product.name,
              unitPrice: line.unitFinal,
              qty: item.qty,
            };
          }),
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return order;
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PENDING_CONFIRM: ["PROCESSING", "CANCELLED"],
  PAID: ["PROCESSING", "REFUNDED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
};

export async function transitionOrder(orderId: string, to: string, actorId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(to)) {
    throw new AppError("INVALID_TRANSITION", `Cannot move from ${order.status} to ${to}`);
  }

  return prisma.$transaction(async (tx) => {
    if (to === "CANCELLED" || to === "REFUNDED") {
      for (const item of order.items) {
        await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.qty } } });
      }
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: to as never },
    });

    await tx.auditLog.create({
      data: { actorId, action: "ORDER_TRANSITION", entity: `Order:${orderId}`, before: { status: order.status }, after: { status: to } },
    });

    return updated;
  });
}
