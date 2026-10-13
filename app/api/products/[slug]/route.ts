import { apiOk, apiError } from "@/lib/http";
import { AppError } from "@/lib/errors";
import { getProductBySlug } from "@/lib/catalog";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    if (!product) throw new AppError("NOT_FOUND", "Product not found");
    return apiOk(product);
  } catch (error) {
    return apiError(error);
  }
}
