import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
        defaultValue: "CUSTOMER",
      },
    },
  },
  plugins: [
    bearer(),
    jwt({
      jwt: {
        definePayload: ({ user }) => ({
          role: (user as { role?: string }).role ?? "CUSTOMER",
        }),
      },
    }),
    // must stay last so Set-Cookie headers apply in Server Actions
    nextCookies(),
  ],
});

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
};
