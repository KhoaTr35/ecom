import { prisma } from "@/lib/db";
import { mockShippingMethods } from "@/lib/mock-data";

export async function listShippingMethods() {
  try {
    return await prisma.shippingMethod.findMany({ where: { active: true }, orderBy: { fee: "asc" } });
  } catch {
    return mockShippingMethods;
  }
}
