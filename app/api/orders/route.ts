import { NextRequest } from "next/server";
import { apiOk } from "@/lib/http";
import { withAuth } from "@/lib/auth/with-auth";
import { placeOrderSchema } from "@/lib/validation/order";
import { placeOrder } from "@/lib/order";
import { getPaymentProvider } from "@/lib/payment";

export const POST = withAuth(["CUSTOMER", "STAFF", "ADMIN"], async (req: NextRequest, user) => {
  const body = placeOrderSchema.parse(await req.json());
  const now = new Date();

  const order = await placeOrder({ userId: user.id, now, ...body });
  const payment = await getPaymentProvider(body.paymentMethod).createPayment(order, {
    ipAddr: req.headers.get("x-forwarded-for") ?? "unknown",
    now,
  });

  return apiOk({ order, ...payment });
});
