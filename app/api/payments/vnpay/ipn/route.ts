import { NextRequest, NextResponse } from "next/server";
import { handleVnpayIpn } from "@/lib/payment";

/**
 * VNPay calls this server-to-server; it is the authoritative source of payment
 * truth (the browser return URL is only for display). Public by design — the
 * HMAC signature is the authentication.
 */
export async function GET(req: NextRequest) {
  const result = await handleVnpayIpn(req.nextUrl.searchParams);
  return NextResponse.json(result);
}
