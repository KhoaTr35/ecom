import { cod } from "@/lib/payment/cod";
import { vnpay } from "@/lib/payment/vnpay";
import type { PaymentProvider } from "@/lib/payment/types";

export type { PaymentProvider } from "@/lib/payment/types";
export { cod } from "@/lib/payment/cod";
export { vnpay, handleVnpayIpn, IPN_RESPONSE } from "@/lib/payment/vnpay";

export function getPaymentProvider(method: "VNPAY" | "COD"): PaymentProvider {
  return method === "VNPAY" ? vnpay : cod;
}
