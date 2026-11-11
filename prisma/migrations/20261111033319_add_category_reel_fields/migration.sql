-- Mobile "Reel Commerce" redesign: Category gains optional copy for the
-- Feed's collection-reel slide. Both columns are nullable — no backfill,
-- no downtime, existing rows are valid as-is.
ALTER TABLE "public"."Category" ADD COLUMN "tagline" TEXT;
ALTER TABLE "public"."Category" ADD COLUMN "heroMediaUrl" TEXT;
