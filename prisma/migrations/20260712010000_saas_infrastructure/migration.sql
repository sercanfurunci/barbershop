-- SaaS Infrastructure: feature flags, integrations, webhooks, background jobs,
-- subscription lifecycle fields, plan tier expansion.

-- New plan tiers
ALTER TYPE "PlanTier" ADD VALUE 'PROFESSIONAL';
ALTER TYPE "PlanTier" ADD VALUE 'AI';

-- Subscription lifecycle: grace period, cancellation date, start date, auto-renewal
ALTER TABLE "Shop"
  ADD COLUMN "subscriptionStartAt" TIMESTAMP(3),
  ADD COLUMN "cancelledAt"         TIMESTAMP(3),
  ADD COLUMN "gracePeriodEndsAt"   TIMESTAMP(3),
  ADD COLUMN "autoRenew"           BOOLEAN NOT NULL DEFAULT true;

-- Per-tenant feature flag overrides
CREATE TABLE "ShopFeatureOverride" (
    "id"        TEXT NOT NULL,
    "shopId"    TEXT NOT NULL,
    "feature"   TEXT NOT NULL,
    "enabled"   BOOLEAN NOT NULL,
    "reason"    TEXT,
    "setBy"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShopFeatureOverride_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ShopFeatureOverride_shopId_feature_key" ON "ShopFeatureOverride"("shopId", "feature");
CREATE INDEX "ShopFeatureOverride_shopId_idx"  ON "ShopFeatureOverride"("shopId");
CREATE INDEX "ShopFeatureOverride_feature_idx" ON "ShopFeatureOverride"("feature");
ALTER TABLE "ShopFeatureOverride" ADD CONSTRAINT "ShopFeatureOverride_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- External integration configs
CREATE TABLE "Integration" (
    "id"             TEXT NOT NULL,
    "shopId"         TEXT NOT NULL,
    "provider"       TEXT NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "config"         JSONB,
    "encryptedCreds" JSONB,
    "lastSyncAt"     TIMESTAMP(3),
    "lastError"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Integration_shopId_provider_key" ON "Integration"("shopId", "provider");
CREATE INDEX "Integration_shopId_idx"         ON "Integration"("shopId");
CREATE INDEX "Integration_provider_status_idx" ON "Integration"("provider", "status");
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Outgoing webhook subscriptions
CREATE TABLE "WebhookSubscription" (
    "id"        TEXT NOT NULL,
    "shopId"    TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "events"    TEXT[],
    "secret"    TEXT NOT NULL,
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WebhookSubscription_shopId_idx" ON "WebhookSubscription"("shopId");
CREATE INDEX "WebhookSubscription_active_idx" ON "WebhookSubscription"("active");
ALTER TABLE "WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Webhook delivery log (one row per delivery attempt set)
CREATE TABLE "WebhookDelivery" (
    "id"             TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "event"          TEXT NOT NULL,
    "payload"        JSONB NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "attempts"       INTEGER NOT NULL DEFAULT 0,
    "maxAttempts"    INTEGER NOT NULL DEFAULT 3,
    "nextRetryAt"    TIMESTAMP(3),
    "responseStatus" INTEGER,
    "responseBody"   TEXT,
    "lastError"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "WebhookDelivery_subscriptionId_status_idx" ON "WebhookDelivery"("subscriptionId", "status");
CREATE INDEX "WebhookDelivery_status_nextRetryAt_idx"    ON "WebhookDelivery"("status", "nextRetryAt");
CREATE INDEX "WebhookDelivery_event_idx"                 ON "WebhookDelivery"("event");
ALTER TABLE "WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Generic background job queue
CREATE TABLE "BackgroundJob" (
    "id"           TEXT NOT NULL,
    "shopId"       TEXT,
    "type"         TEXT NOT NULL,
    "payload"      JSONB,
    "status"       TEXT NOT NULL DEFAULT 'PENDING',
    "attempts"     INTEGER NOT NULL DEFAULT 0,
    "maxAttempts"  INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt"  TIMESTAMP(3),
    "lastError"    TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BackgroundJob_status_scheduledFor_idx" ON "BackgroundJob"("status", "scheduledFor");
CREATE INDEX "BackgroundJob_shopId_type_idx"         ON "BackgroundJob"("shopId", "type");
CREATE INDEX "BackgroundJob_type_idx"                ON "BackgroundJob"("type");
ALTER TABLE "BackgroundJob" ADD CONSTRAINT "BackgroundJob_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
