import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { AppError } from "@/lib/errors";
import { clearOtherDefaults } from "@/lib/address";
import { updateAddressSchema } from "@/lib/validation/address";
import { prisma } from "@/lib/db";

async function getOwnedAddress(id: string, userId: string) {
  const address = await prisma.address.findUnique({ where: { id } });
  if (!address) throw new AppError("NOT_FOUND", "Address not found");
  if (address.userId !== userId) throw new AppError("FORBIDDEN", "Not your address");
  return address;
}

export const PATCH = withAuth("ANY", async (req, user, ctx) => {
  const { id } = await ctx.params;
  await getOwnedAddress(id, user.id);

  const data = updateAddressSchema.parse(await req.json());
  const address = await prisma.address.update({ where: { id }, data });
  if (data.isDefault) await clearOtherDefaults(user.id, id);

  return apiOk(address);
});

export const DELETE = withAuth("ANY", async (_req, user, ctx) => {
  const { id } = await ctx.params;
  const address = await getOwnedAddress(id, user.id);

  await prisma.address.delete({ where: { id } });

  // Deleting the default leaves no default — promote whatever's left, if anything.
  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: user.id } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }

  return apiOk({ id });
});
