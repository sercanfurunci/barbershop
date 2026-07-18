-- AI Phase 4 observability columns (additive, safe)
ALTER TABLE "AiUsageLog" ADD COLUMN "intent" TEXT;
ALTER TABLE "AiUsageLog" ADD COLUMN "cacheReadTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiUsageLog" ADD COLUMN "cacheWriteTokens" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AiUsageLog" ADD COLUMN "qualityScore" INTEGER;
ALTER TABLE "AiUsageLog" ADD COLUMN "debug" JSONB;
