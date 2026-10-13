import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/http";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { track } from "@/lib/analytics";
import { trackEventSchema } from "@/lib/validation/analytics";

const SESSION_COOKIE = "analytics_sid";

/** No auth required — most funnel traffic (product_view, add_to_cart) is
 * anonymous and happens before any login. Per the project's own analytics
 * design, an event is only recorded once the visitor has a session id,
 * which the client only sets after cookie consent — so a missing cookie is
 * a normal "not consented yet" state, not an error. */
export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionId) return apiOk({ recorded: false });

    const { type, payload } = trackEventSchema.parse(await req.json());
    const user = await getCurrentUser(req.headers);
    await track(type, { sessionId, userId: user?.id }, payload);
    return apiOk({ recorded: true });
  } catch (error) {
    return apiError(error);
  }
}
