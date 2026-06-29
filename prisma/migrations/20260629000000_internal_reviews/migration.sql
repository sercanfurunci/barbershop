-- Internal review system.
-- Shop aggregates + Appointment.reviewed flag + Review table.

ALTER TABLE "Shop"
  ADD COLUMN "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "totalReviews" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Appointment"
  ADD COLUMN "reviewed" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Review" (
  "id"            TEXT NOT NULL,
  "shopId"        TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "barberId"      TEXT NOT NULL,
  "customerId"    TEXT,
  "shopRating"    INTEGER NOT NULL,
  "barberRating"  INTEGER NOT NULL,
  "comment"       TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Review_appointmentId_key" ON "Review"("appointmentId");
CREATE INDEX "Review_shopId_createdAt_idx"      ON "Review"("shopId", "createdAt");
CREATE INDEX "Review_barberId_createdAt_idx"    ON "Review"("barberId", "createdAt");
CREATE INDEX "Review_shopId_shopRating_idx"     ON "Review"("shopId", "shopRating");
CREATE INDEX "Review_barberId_barberRating_idx" ON "Review"("barberId", "barberRating");

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_barberId_fkey"
  FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
