import { NextRequest } from "next/server";
import { apiError } from "@/lib/http";
import { AppError } from "@/lib/errors";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { AuthUser } from "@/lib/auth";

const MUTATING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: NextRequest, user: AuthUser, ctx: RouteContext) => Promise<Response>;

export function withAuth(roles: readonly AuthUser["role"][] | "ANY", handler: Handler) {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      // CSRF: a cookie-bearing mutating request must come from our own origin.
      const usesCookie = req.headers.has("cookie") && !req.headers.has("authorization");
      if (usesCookie && MUTATING_METHODS.has(req.method)) {
        const origin = req.headers.get("origin");
        if (origin !== process.env.APP_URL) {
          throw new AppError("FORBIDDEN", "Invalid origin");
        }
      }

      const user = await getCurrentUser(req.headers);
      if (!user) throw new AppError("UNAUTHENTICATED", "You need to be logged in");

      if (roles !== "ANY" && !roles.includes(user.role)) {
        throw new AppError("FORBIDDEN", "You don't have permission to do this");
      }

      return await handler(req, user, ctx);
    } catch (error) {
      return apiError(error);
    }
  };
}
