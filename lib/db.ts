import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Each warm serverless instance keeps its own pool; pg's default (max: 10)
    // times many concurrent instances can exceed Supabase's connection limit.
    // A small cap per instance is cheap because the Supavisor transaction
    // pooler already multiplexes underneath it.
    ...(process.env.NODE_ENV === "production" ? { max: 3, idleTimeoutMillis: 10_000 } : {}),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
