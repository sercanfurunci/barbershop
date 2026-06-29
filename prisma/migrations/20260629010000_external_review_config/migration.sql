-- External review configuration + future-channel NotifChannel values.
--
-- Shop gains a direct googleReviewUrl (separate from googlePlaceId, which is
-- kept around for the existing places widget) and a per-shop toggle for the
-- 2h post-completion review reminder cron.
--
-- NotifChannel learns IN_APP + PUSH so the queue can hold mobile-app jobs
-- ahead of a delivery worker existing. NotificationJob.phone becomes nullable
-- because those channels have no phone number — SMS/WHATSAPP callers still
-- pass one (enforced in lib/notifications, not the DB).

ALTER TABLE "Shop"
  ADD COLUMN "googleReviewUrl" TEXT,
  ADD COLUMN "reviewReminderEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TYPE "NotifChannel" ADD VALUE IF NOT EXISTS 'IN_APP';
ALTER TYPE "NotifChannel" ADD VALUE IF NOT EXISTS 'PUSH';

ALTER TABLE "NotificationJob"
  ALTER COLUMN "phone" DROP NOT NULL;
