import { createRemoteJWKSet, jwtVerify } from "jose";
import { auth, type AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

function getJwks() {
  const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  jwks ??= createRemoteJWKSet(new URL("/api/auth/jwks", baseUrl));
  return jwks;
}

async function userFromJwt(token: string): Promise<AuthUser | null> {
  try {
    const baseUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: baseUrl,
      audience: baseUrl,
    });
    if (!payload.sub) return null;

    // Role is re-read from the DB — never trust the JWT claim alone.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

async function userFromSession(headers: Headers): Promise<AuthUser | null> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user) return null;
  const { id, email, name, role } = session.user as unknown as AuthUser;
  return { id, email, name, role };
}

export async function getCurrentUser(headers: Headers): Promise<AuthUser | null> {
  const authorization = headers.get("authorization");
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  // A signed JWT has three dot-separated segments; the bearer plugin's
  // opaque session token does not, so route it to the session lookup instead.
  if (bearerToken && bearerToken.split(".").length === 3) {
    return userFromJwt(bearerToken);
  }

  return userFromSession(headers);
}
