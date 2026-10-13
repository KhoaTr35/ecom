import { describe, expect, it } from "vitest";
import {
  buildSignData,
  formatVnpayDate,
  signParams,
  verifyCallback,
} from "@/lib/payment/vnpay-signature";

const SECRET = "SANDBOXSECRET123";

/** A representative v2.1.0 payment payload. */
const SAMPLE: Record<string, string> = {
  vnp_Version: "2.1.0",
  vnp_Command: "pay",
  vnp_TmnCode: "DEMOCODE",
  vnp_Amount: "489000000",
  vnp_CurrCode: "VND",
  vnp_TxnRef: "ORDTEST1",
  vnp_OrderInfo: "Thanh toan don hang ORDTEST1",
  vnp_OrderType: "other",
  vnp_Locale: "vn",
  vnp_ReturnUrl: "http://localhost:3000/api/payments/vnpay/return",
  vnp_IpAddr: "127.0.0.1",
  vnp_CreateDate: "20260309210000",
};

function signedCallback(overrides: Record<string, string> = {}) {
  const params = { ...SAMPLE, vnp_ResponseCode: "00", ...overrides };
  const search = new URLSearchParams(params);
  search.set("vnp_SecureHash", signParams(params, SECRET));
  return search;
}

describe("buildSignData", () => {
  it("sorts parameters by name", () => {
    const data = buildSignData({ vnp_TxnRef: "B", vnp_Amount: "1", vnp_Command: "pay" });
    expect(data).toBe("vnp_Amount=1&vnp_Command=pay&vnp_TxnRef=B");
  });

  it("encodes spaces as + the way VNPay does", () => {
    expect(buildSignData({ vnp_OrderInfo: "Thanh toan ORD1" })).toBe("vnp_OrderInfo=Thanh+toan+ORD1");
  });

  it("excludes the hash fields from the signed payload", () => {
    const data = buildSignData({ vnp_Amount: "1", vnp_SecureHash: "abc", vnp_SecureHashType: "SHA512" });
    expect(data).toBe("vnp_Amount=1");
  });
});

describe("signParams", () => {
  it("produces a stable lowercase hex SHA-512 HMAC", () => {
    const hash = signParams(SAMPLE, SECRET);
    expect(hash).toMatch(/^[0-9a-f]{128}$/);
    expect(signParams(SAMPLE, SECRET)).toBe(hash);
  });

  it("changes when any parameter changes", () => {
    const tampered = { ...SAMPLE, vnp_Amount: "100" };
    expect(signParams(tampered, SECRET)).not.toBe(signParams(SAMPLE, SECRET));
  });

  it("changes when the secret changes", () => {
    expect(signParams(SAMPLE, "OTHER")).not.toBe(signParams(SAMPLE, SECRET));
  });
});

describe("verifyCallback", () => {
  it("accepts a correctly signed callback", () => {
    const result = verifyCallback(signedCallback(), SECRET);
    expect(result.valid).toBe(true);
    expect(result.success).toBe(true);
    expect(result.txnRef).toBe("ORDTEST1");
  });

  it("converts vnp_Amount back to VND (total x 100)", () => {
    // 489000000 / 100 = 4_890_000 — matches an order total of 4.890.000d.
    expect(verifyCallback(signedCallback(), SECRET).amount).toBe(4_890_000);
  });

  it("rejects a tampered amount", () => {
    const search = signedCallback();
    search.set("vnp_Amount", "100");
    expect(verifyCallback(search, SECRET).valid).toBe(false);
  });

  it("rejects a forged signature", () => {
    const search = signedCallback();
    search.set("vnp_SecureHash", "f".repeat(128));
    expect(verifyCallback(search, SECRET).valid).toBe(false);
  });

  it("rejects a missing signature", () => {
    const search = signedCallback();
    search.delete("vnp_SecureHash");
    expect(verifyCallback(search, SECRET).valid).toBe(false);
  });

  it("rejects a callback signed with a different secret", () => {
    expect(verifyCallback(signedCallback(), "WRONG-SECRET").valid).toBe(false);
  });

  it("reports a failed payment as valid but unsuccessful", () => {
    const result = verifyCallback(signedCallback({ vnp_ResponseCode: "24" }), SECRET);
    expect(result.valid).toBe(true);
    expect(result.success).toBe(false);
  });

  it("round-trips values that need URL encoding", () => {
    // vnp_OrderInfo contains spaces, so encode/decode must be symmetric.
    expect(verifyCallback(signedCallback(), SECRET).valid).toBe(true);
  });
});

describe("formatVnpayDate", () => {
  it("formats as yyyyMMddHHmmss in Vietnam local time", () => {
    // 14:00Z is 21:00 on the same day in Vietnam (UTC+7).
    expect(formatVnpayDate(new Date("2026-03-09T14:00:00Z"))).toBe("20260309210000");
  });

  it("rolls over to the next Vietnam day for late-UTC instants", () => {
    // 18:30Z is 01:30 the following day in Vietnam.
    expect(formatVnpayDate(new Date("2026-03-09T18:30:00Z"))).toBe("20260310013000");
  });

  it("renders Vietnam midnight as 00, not 24", () => {
    // 17:00Z is exactly 00:00 the next day in Vietnam.
    expect(formatVnpayDate(new Date("2026-03-09T17:00:00Z"))).toBe("20260310000000");
  });
});
