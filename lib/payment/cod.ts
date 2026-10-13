import type { PaymentProvider } from "@/lib/payment/types";

export const cod: PaymentProvider = {
  async createPayment() {
    // COD never redirects — the order just waits for staff confirmation.
    return {};
  },
};
