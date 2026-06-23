-- Soft-delete column on Shop
ALTER TABLE "Shop" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Shop_deletedAt_idx" ON "Shop"("deletedAt");

-- Protect billing + audit trail from cascade. Hard-delete must now soft-delete first.
ALTER TABLE "Invoice"  DROP CONSTRAINT "Invoice_shopId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_shopId_fkey";

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
