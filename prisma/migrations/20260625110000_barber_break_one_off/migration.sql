-- One-off breaks for an instant "Mola" toggle (dayOfWeek stays for recurring breaks).
ALTER TABLE "BarberBreak" ADD COLUMN "date" TEXT;
CREATE INDEX IF NOT EXISTS "BarberBreak_date_idx" ON "BarberBreak"("date");
