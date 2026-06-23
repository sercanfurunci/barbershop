-- BarberBreak previously had no index; availability lookups scan-joined.
CREATE INDEX IF NOT EXISTS "BarberBreak_barberId_idx" ON "BarberBreak"("barberId");
