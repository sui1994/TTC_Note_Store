ALTER TABLE "public"."Purchase"
ADD COLUMN "productId" TEXT,
ADD COLUMN "variantId" TEXT,
ADD COLUMN "stripeSessionId" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDING';

UPDATE "public"."Purchase"
SET
  "productId" = CASE
    WHEN "bookId" IS NULL THEN NULL
    WHEN POSITION('::' IN "bookId") > 0 THEN SPLIT_PART("bookId", '::', 1)
    ELSE "bookId"
  END,
  "variantId" = CASE
    WHEN "bookId" IS NULL THEN NULL
    WHEN POSITION('::' IN "bookId") > 0 THEN NULLIF(SPLIT_PART("bookId", '::', 2), '')
    ELSE NULL
  END
WHERE "productId" IS NULL
   OR "variantId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_stripeSessionId_key" ON "public"."Purchase"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "Purchase_userId_productId_idx" ON "public"."Purchase"("userId", "productId");
CREATE INDEX IF NOT EXISTS "Purchase_userId_createdAt_idx" ON "public"."Purchase"("userId", "createdAt");
