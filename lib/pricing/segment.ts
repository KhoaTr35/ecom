import { prisma } from "@/lib/db";
import type { Segment } from "@/lib/pricing/types";

/** Orders that count as a completed purchase (plan section 5.5 KPI definition). */
const PURCHASED_STATUSES = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

/**
 * DB-backed lookup of a customer's pricing segment. `calculatePrice` itself
 * stays pure — callers resolve the segment and pass it in.
 */
export async function resolveSegment(userId: string | null): Promise<Segment> {
  if (!userId) return "GUEST";

  try {
    const purchased = await prisma.order.count({
      where: { userId, status: { in: [...PURCHASED_STATUSES] } },
    });
    return purchased > 0 ? "RETURNING" : "NEW";
  } catch {
    // Never block a quote on a segment lookup; NEW is the safe default for a signed-in user.
    return "NEW";
  }
}
