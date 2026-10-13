import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * VNPay v2.1.0 signing. The gateway builds its checksum from the parameters
 * sorted by name and encoded in a specific way (spaces as "+"), so this
 * encoding must be reproduced exactly or every signature check fails.
 */

const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Fields that are never part of the signed payload. */
const SIGNATURE_FIELDS = ["vnp_SecureHash", "vnp_SecureHashType"];

function encodeComponent(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

/** Sorted `key=value&...` string that VNPay computes its HMAC over. */
export function buildSignData(params: Record<string, string>): string {
  return Object.keys(params)
    .filter((key) => !SIGNATURE_FIELDS.includes(key) && params[key] !== "" && params[key] != null)
    .sort()
    .map((key) => `${encodeComponent(key)}=${encodeComponent(params[key])}`)
    .join("&");
}

export function signParams(params: Record<string, string>, secret: string): string {
  return createHmac("sha512", secret).update(buildSignData(params), "utf-8").digest("hex");
}

/** Constant-time compare so a bad signature cannot be guessed byte by byte. */
function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a.toLowerCase(), "utf-8");
  const right = Buffer.from(b.toLowerCase(), "utf-8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export type VnpayCallback = {
  valid: boolean;
  txnRef: string;
  /** In VND — VNPay transmits the amount multiplied by 100. */
  amount: number;
  success: boolean;
};

/**
 * Validates a return/IPN callback. `valid` only reports signature integrity;
 * `success` reports whether VNPay says the payment went through.
 */
export function verifyCallback(params: URLSearchParams, secret: string): VnpayCallback {
  const received = Object.fromEntries(params.entries());
  const providedHash = received.vnp_SecureHash ?? "";
  const expectedHash = signParams(received, secret);

  return {
    valid: providedHash.length > 0 && hashesMatch(providedHash, expectedHash),
    txnRef: received.vnp_TxnRef ?? "",
    amount: Number(received.vnp_Amount ?? 0) / 100,
    success: received.vnp_ResponseCode === "00",
  };
}

/** `yyyyMMddHHmmss` in Vietnam local time, the only format VNPay accepts. */
export function formatVnpayDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  // hour12:false can render midnight as "24" on some engines.
  const hour = String(Number(read("hour")) % 24).padStart(2, "0");
  return `${read("year")}${read("month")}${read("day")}${hour}${read("minute")}${read("second")}`;
}
