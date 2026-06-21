-- Add optional unique custom domain to Shop.
-- Nullable column + unique index — non-destructive, safe on a live DB.
ALTER TABLE "Shop" ADD COLUMN "customDomain" TEXT;
CREATE UNIQUE INDEX "Shop_customDomain_key" ON "Shop"("customDomain");
