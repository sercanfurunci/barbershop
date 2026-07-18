-- ai-memory admin list sorts by updatedAt within a shop
CREATE INDEX IF NOT EXISTS "CustomerMemory_shopId_updatedAt_idx" ON "CustomerMemory"("shopId", "updatedAt");
