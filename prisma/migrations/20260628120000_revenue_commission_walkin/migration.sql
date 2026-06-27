-- Phase 1: revenue, commission, walk-in, lifecycle metrics.
-- All additions are nullable or defaulted so this is backwards-compatible —
-- no backfill needed, existing rows stay valid.

-- ─── New enums ───────────────────────────────────────────────────────────────
CREATE TYPE "PaymentType"   AS ENUM ('PERCENTAGE', 'FIXED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER');

-- ─── Shop: default commission rate for new barbers ───────────────────────────
ALTER TABLE "Shop"
  ADD COLUMN "defaultCommissionRate" INTEGER NOT NULL DEFAULT 50;

-- ─── Barber: per-barber earnings model ───────────────────────────────────────
ALTER TABLE "Barber"
  ADD COLUMN "paymentType"    "PaymentType" NOT NULL DEFAULT 'PERCENTAGE',
  ADD COLUMN "commissionRate" INTEGER       NOT NULL DEFAULT 50,
  ADD COLUMN "fixedSalary"    INTEGER;

-- ─── Client: lifetime metrics (cheap dashboards, kept fresh on completion) ──
ALTER TABLE "Client"
  ADD COLUMN "totalSpent"  INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN "visitCount"  INTEGER  NOT NULL DEFAULT 0,
  ADD COLUMN "lastVisitAt" TIMESTAMP(3);

-- ─── Appointment: revenue split, completion audit, cancellation, walk-in ───
ALTER TABLE "Appointment"
  ADD COLUMN "grossAmount"        INTEGER,
  ADD COLUMN "barberAmount"       INTEGER,
  ADD COLUMN "shopAmount"         INTEGER,
  ADD COLUMN "tipAmount"          INTEGER         NOT NULL DEFAULT 0,
  ADD COLUMN "paymentMethod"      "PaymentMethod",
  ADD COLUMN "completedAt"        TIMESTAMP(3),
  ADD COLUMN "cancelledAt"        TIMESTAMP(3),
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelledBy"        TEXT,
  ADD COLUMN "isWalkIn"           BOOLEAN         NOT NULL DEFAULT false,
  ADD COLUMN "customServiceName"  TEXT;
