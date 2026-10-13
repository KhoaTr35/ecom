import { apiOk, apiError } from "@/lib/http";
import { listShippingMethods } from "@/lib/shipping";

export async function GET() {
  try {
    return apiOk(await listShippingMethods());
  } catch (error) {
    return apiError(error);
  }
}
