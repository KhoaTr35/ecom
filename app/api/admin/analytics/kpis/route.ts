import { NextRequest } from "next/server";
import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { getKpis } from "@/lib/analytics";

export const GET = withAuth(["ADMIN"], async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const to = sp.get("to") ? new Date(sp.get("to")!) : new Date();
  const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(to.getTime() - 30 * 86_400_000);
  return apiOk(await getKpis({ from, to }));
});
