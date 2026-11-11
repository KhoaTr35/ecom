-- Enable Row Level Security on every table in `public`.
--
-- Supabase grants the `anon` and `authenticated` roles full
-- SELECT/INSERT/UPDATE/DELETE/TRUNCATE on `public` so its auto-generated Data
-- API (PostgREST) can serve them. This project never uses that API — all
-- access goes through Prisma over the Postgres protocol — so without RLS,
-- anyone holding the project's publishable anon key could read or modify
-- every row, including auth tables and customer orders.
--
-- No policies are defined on purpose: the application connects as `postgres`,
-- which has BYPASSRLS, so it keeps unrestricted access while anon/authenticated
-- are denied everything. Add policies only if the Data API is ever adopted.
--
-- Do NOT add FORCE ROW LEVEL SECURITY to these tables. FORCE makes RLS apply
-- to the table owner as well, which would bypass the BYPASSRLS this setup
-- depends on — every Prisma query would start returning zero rows instead of
-- raising an error, which is a particularly hard failure to diagnose.
--
-- On the local Docker Postgres these statements are harmless: the `anon` and
-- `authenticated` roles do not exist there, the statements never reference
-- them, and the local `postgres` superuser bypasses RLS too.

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Jwks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."ShippingMethod" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PriceRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AnalyticsEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."AuditLog" ENABLE ROW LEVEL SECURITY;
