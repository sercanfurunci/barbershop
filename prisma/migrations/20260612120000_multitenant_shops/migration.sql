-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-tenant migration: introduce Shop entity, scope all business tables by
-- shopId, backfill existing rows into the default "Abdurrahman Çelik" shop.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Enums ────────────────────────────────────────────────────────────────
CREATE TYPE "ShopStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN' BEFORE 'ADMIN';

-- ── 2. Shop table ───────────────────────────────────────────────────────────
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "description" TEXT,
    "social" JSONB,
    "status" "ShopStatus" NOT NULL DEFAULT 'ACTIVE',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Istanbul',
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");

-- ── 3. Default shop row (carries existing data) ─────────────────────────────
INSERT INTO "Shop" ("id", "slug", "name", "address", "phone", "email", "description", "social", "status", "timezone", "currency", "updatedAt")
VALUES (
    'shop-abdurrahman',
    'abdurrahman',
    'Abdurrahman Çelik Exclusive Salon',
    'Darıca, Kocaeli, Türkiye',
    NULL,
    NULL,
    'Premium berber salonu — klasik tıraş, modern stil.',
    NULL,
    'ACTIVE',
    'Europe/Istanbul',
    'TRY',
    CURRENT_TIMESTAMP
);

-- ── 4. Add shopId columns (nullable initially for backfill) ─────────────────
ALTER TABLE "User"         ADD COLUMN "shopId" TEXT;
ALTER TABLE "Barber"       ADD COLUMN "shopId" TEXT;
ALTER TABLE "Service"      ADD COLUMN "shopId" TEXT;
ALTER TABLE "Client"       ADD COLUMN "shopId" TEXT;
ALTER TABLE "Appointment"  ADD COLUMN "shopId" TEXT;
ALTER TABLE "Holiday"      ADD COLUMN "shopId" TEXT;
ALTER TABLE "AuditLog"     ADD COLUMN "shopId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "shopId" TEXT;

-- ── 5. Backfill all existing rows into the default shop ─────────────────────
UPDATE "User"         SET "shopId" = 'shop-abdurrahman' WHERE "shopId" IS NULL;
UPDATE "Barber"       SET "shopId" = 'shop-abdurrahman' WHERE "shopId" IS NULL;
UPDATE "Service"      SET "shopId" = 'shop-abdurrahman' WHERE "shopId" IS NULL;
UPDATE "Client"       SET "shopId" = 'shop-abdurrahman' WHERE "shopId" IS NULL;
UPDATE "Appointment"  SET "shopId" = 'shop-abdurrahman' WHERE "shopId" IS NULL;
UPDATE "Holiday"      SET "shopId" = 'shop-abdurrahman' WHERE "shopId" IS NULL;
UPDATE "Notification" SET "shopId" = 'shop-abdurrahman' WHERE "shopId" IS NULL;
-- AuditLog: stays nullable (platform-level actions by SUPER_ADMIN have null shopId)

-- ── 6. Enforce NOT NULL on business entities ────────────────────────────────
ALTER TABLE "Barber"       ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "Service"      ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "Client"       ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "Appointment"  ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "Holiday"      ALTER COLUMN "shopId" SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "shopId" SET NOT NULL;
-- "User"."shopId" stays NULLABLE: SUPER_ADMIN belongs to no shop
-- "AuditLog"."shopId" stays NULLABLE: platform-level audit entries

-- ── 7. Replace global uniques with shop-scoped compound uniques ─────────────
ALTER TABLE "Barber" DROP CONSTRAINT IF EXISTS "Barber_slug_key";
CREATE UNIQUE INDEX "Barber_shopId_slug_key" ON "Barber"("shopId", "slug");

ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_phone_key";
CREATE UNIQUE INDEX "Client_shopId_phone_key" ON "Client"("shopId", "phone");

-- ── 8. Foreign keys ─────────────────────────────────────────────────────────
ALTER TABLE "User"
  ADD CONSTRAINT "User_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Barber"
  ADD CONSTRAINT "Barber_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Service"
  ADD CONSTRAINT "Service_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Client"
  ADD CONSTRAINT "Client_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Holiday"
  ADD CONSTRAINT "Holiday_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 9. Shop-scoped indexes ──────────────────────────────────────────────────
CREATE INDEX "User_shopId_idx"         ON "User"("shopId");
CREATE INDEX "Barber_shopId_idx"       ON "Barber"("shopId");
CREATE INDEX "Service_shopId_idx"      ON "Service"("shopId");
CREATE INDEX "Client_shopId_name_idx"  ON "Client"("shopId", "name");
CREATE INDEX "Appointment_shopId_date_idx"   ON "Appointment"("shopId", "date");
CREATE INDEX "Appointment_shopId_status_idx" ON "Appointment"("shopId", "status");
CREATE INDEX "Holiday_shopId_date_idx"       ON "Holiday"("shopId", "date");
CREATE INDEX "AuditLog_shopId_createdAt_idx" ON "AuditLog"("shopId", "createdAt");
CREATE INDEX "Notification_shopId_status_idx" ON "Notification"("shopId", "status");

-- Drop the now-redundant single-column Client name index (replaced by compound)
DROP INDEX IF EXISTS "Client_name_idx";
