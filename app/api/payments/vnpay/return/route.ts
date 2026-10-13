import { NextRequest, NextResponse } from "next/server";

/**
 * Display-only redirect. The order's real status comes from the IPN, which may
 * land before or after the customer gets back here, so /checkout/result reads
 * the order from the database rather than trusting these query parameters.
 */
export async function GET(req: NextRequest) {
  const txnRef = req.nextUrl.searchParams.get("vnp_TxnRef");
  const target = new URL("/checkout/result", req.url);
  if (txnRef) target.searchParams.set("order", txnRef);
  return NextResponse.redirect(target);
}
