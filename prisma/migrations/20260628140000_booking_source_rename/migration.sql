-- Rename BookingSource values: WALKIN → WALK_IN, PHONE → MANUAL.
-- Postgres enum recreation: add new values, backfill rows, swap type.

ALTER TYPE "BookingSource" RENAME TO "BookingSource_old";

CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'WALK_IN', 'MANUAL');

ALTER TABLE "Appointment" ALTER COLUMN "source" DROP DEFAULT;

ALTER TABLE "Appointment"
  ALTER COLUMN "source" TYPE "BookingSource"
  USING (
    CASE "source"::text
      WHEN 'WALKIN' THEN 'WALK_IN'::"BookingSource"
      WHEN 'PHONE'  THEN 'MANUAL'::"BookingSource"
      ELSE "source"::text::"BookingSource"
    END
  );

ALTER TABLE "Appointment" ALTER COLUMN "source" SET DEFAULT 'ONLINE';

DROP TYPE "BookingSource_old";
