-- Plan tier
CREATE TYPE "PlanTier" AS ENUM ('STARTER', 'PRO', 'ENTERPRISE');

-- Subscription status
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- Shop subscription fields (all nullable / defaulted so existing rows are valid)
ALTER TABLE "Shop"
  ADD COLUMN "planTier"            "PlanTier"           NOT NULL DEFAULT 'STARTER',
  ADD COLUMN "subscriptionStatus"  "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  ADD COLUMN "trialEndsAt"         TIMESTAMP(3),
  ADD COLUMN "currentPeriodEndsAt" TIMESTAMP(3),
  ADD COLUMN "paymentProvider"     TEXT,
  ADD COLUMN "paymentProviderRef"  TEXT;

-- Backfill: existing shops are treated as ACTIVE (legacy customers, no trial).
UPDATE "Shop" SET "subscriptionStatus" = 'ACTIVE' WHERE "createdAt" < NOW();

-- Invoices ledger
CREATE TABLE "Invoice" (
  "id"                TEXT NOT NULL,
  "shopId"            TEXT NOT NULL,
  "providerInvoiceId" TEXT,
  "provider"          TEXT,
  "amount"            INTEGER NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'TRY',
  "status"            TEXT NOT NULL,
  "paidAt"            TIMESTAMP(3),
  "paymentMethod"     TEXT,
  "periodStart"       TIMESTAMP(3),
  "periodEnd"         TIMESTAMP(3),
  "raw"               JSONB,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invoice_providerInvoiceId_key" ON "Invoice"("providerInvoiceId");
CREATE INDEX "Invoice_shopId_createdAt_idx" ON "Invoice"("shopId", "createdAt");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
