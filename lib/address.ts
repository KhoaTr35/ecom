import { prisma } from "@/lib/db";

/** Only one address per user can be default — unset every other one. */
export async function clearOtherDefaults(userId: string, keepAddressId: string) {
  await prisma.address.updateMany({
    where: { userId, id: { not: keepAddressId }, isDefault: true },
    data: { isDefault: false },
  });
}
