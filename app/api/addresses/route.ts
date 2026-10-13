import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { clearOtherDefaults } from "@/lib/address";
import { createAddressSchema } from "@/lib/validation/address";
import { prisma } from "@/lib/db";

export const GET = withAuth("ANY", async (_req, user) => {
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });
  return apiOk(addresses);
});

export const POST = withAuth("ANY", async (req, user) => {
  const data = createAddressSchema.parse(await req.json());

  // A user's very first address becomes their default automatically — a
  // checkout always needs one to fall back to without an extra "set default" step.
  const existingCount = await prisma.address.count({ where: { userId: user.id } });
  const isDefault = data.isDefault ?? existingCount === 0;

  const address = await prisma.address.create({ data: { ...data, isDefault, userId: user.id } });
  if (isDefault) await clearOtherDefaults(user.id, address.id);

  return apiOk(address);
});
