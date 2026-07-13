-- Production indexes: composite indexes for common query patterns.
-- Generated 2026-07-12. Safe to re-run (IF NOT EXISTS).

-- Appointment
CREATE INDEX IF NOT EXISTS "Appointment_shopId_date_status_idx" ON "Appointment"("shopId", "date", "status");
CREATE INDEX IF NOT EXISTS "Appointment_shopId_barberId_date_idx" ON "Appointment"("shopId", "barberId", "date");
CREATE INDEX IF NOT EXISTS "Appointment_shopId_createdAt_idx" ON "Appointment"("shopId", "createdAt");
CREATE INDEX IF NOT EXISTS "Appointment_barberId_date_status_idx" ON "Appointment"("barberId", "date", "status");
CREATE INDEX IF NOT EXISTS "Appointment_clientId_status_date_idx" ON "Appointment"("clientId", "status", "date");

-- Client
CREATE INDEX IF NOT EXISTS "Client_shopId_createdAt_idx" ON "Client"("shopId", "createdAt");

-- Shop
CREATE INDEX IF NOT EXISTS "Shop_city_status_deletedAt_idx" ON "Shop"("city", "status", "deletedAt");
CREATE INDEX IF NOT EXISTS "Shop_slug_deletedAt_idx" ON "Shop"("slug", "deletedAt");

-- NotificationJob
CREATE INDEX IF NOT EXISTS "NotificationJob_shopId_status_scheduledFor_idx" ON "NotificationJob"("shopId", "status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "NotificationJob_appointmentId_event_status_idx" ON "NotificationJob"("appointmentId", "event", "status");

-- Review
CREATE INDEX IF NOT EXISTS "Review_shopId_barberId_createdAt_idx" ON "Review"("shopId", "barberId", "createdAt");

-- Conversation
CREATE INDEX IF NOT EXISTS "Conversation_shopId_status_updatedAt_idx" ON "Conversation"("shopId", "status", "updatedAt");

-- BackgroundJob
CREATE INDEX IF NOT EXISTS "BackgroundJob_type_status_idx" ON "BackgroundJob"("type", "status");
