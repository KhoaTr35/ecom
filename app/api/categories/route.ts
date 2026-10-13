import { apiOk, apiError } from "@/lib/http";
import { listCategories } from "@/lib/catalog";

export async function GET() {
  try {
    return apiOk(await listCategories());
  } catch (error) {
    return apiError(error);
  }
}
