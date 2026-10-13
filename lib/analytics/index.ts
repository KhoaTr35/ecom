import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export const EVENT_TYPES = ["page_view", "product_view", "add_to_cart", "begin_checkout", "purchase"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export function track(
  type: EventType,
  ctx: { sessionId: string; userId?: string },
  payload?: Record<string, unknown>,
) {
  return prisma.analyticsEvent.create({
    data: { type, sessionId: ctx.sessionId, userId: ctx.userId, payload: payload as Prisma.InputJsonValue },
  });
}

export async function getKpis(range: { from: Date; to: Date }) {
  const where = { createdAt: { gte: range.from, lte: range.to } };

  const [pageViews, purchases, paidOrders] = await Promise.all([
    prisma.analyticsEvent.findMany({ where: { ...where, type: "page_view" }, select: { sessionId: true } }),
    prisma.analyticsEvent.findMany({ where: { ...where, type: "purchase" }, select: { sessionId: true } }),
    prisma.order.aggregate({
      where: { createdAt: where.createdAt, status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      _sum: { total: true },
      _avg: { total: true },
      _count: true,
    }),
  ]);

  const visits = new Set(pageViews.map((e) => e.sessionId)).size;
  const purchasingSessions = new Set(purchases.map((e) => e.sessionId)).size;

  return {
    visits,
    conversionRate: visits === 0 ? 0 : purchasingSessions / visits,
    revenue: paidOrders._sum?.total ?? 0,
    averageOrderValue: Math.round(paidOrders._avg?.total ?? 0),
    orderCount: paidOrders._count,
  };
}

/** Distinct sessions per funnel stage in the range — independent per-stage
 * counts, not a strict same-session-through-every-stage funnel; matches the
 * aggregate (not cohort) depth of the KPIs above. */
export async function getFunnel(range: { from: Date; to: Date }) {
  const where = { createdAt: { gte: range.from, lte: range.to } };
  const stages: EventType[] = ["product_view", "add_to_cart", "begin_checkout", "purchase"];

  const counts = await Promise.all(
    stages.map((type) =>
      prisma.analyticsEvent
        .findMany({ where: { ...where, type }, select: { sessionId: true } })
        .then((rows) => new Set(rows.map((r) => r.sessionId)).size),
    ),
  );

  return stages.map((stage, i) => ({ stage, sessions: counts[i] }));
}

/** Daily revenue for the trend chart — bucketed in JS rather than a
 * date_trunc query since the order volume here is small (course project). */
export async function getDailyRevenue(range: { from: Date; to: Date }) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
    },
    select: { createdAt: true, total: true },
  });

  const byDay = new Map<string, number>();
  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + order.total);
  }

  const days: { date: string; revenue: number }[] = [];
  for (
    const cursor = new Date(range.from);
    cursor.getTime() <= range.to.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({ date: key, revenue: byDay.get(key) ?? 0 });
  }
  return days;
}
