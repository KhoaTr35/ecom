import { NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/http";
import { listProducts } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const result = await listProducts({
      categorySlug: sp.get("category") ?? undefined,
      q: sp.get("q") ?? undefined,
      page: sp.get("page") ? Number(sp.get("page")) : undefined,
    });
    return apiOk(result);
  } catch (error) {
    return apiError(error);
  }
}
