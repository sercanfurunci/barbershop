-- Salon Profile fields. All nullable / defaulted so existing rows keep working.
ALTER TABLE "Shop"
  ADD COLUMN "coverImage"     TEXT,
  ADD COLUMN "addressLine"    TEXT,
  ADD COLUMN "city"           TEXT,
  ADD COLUMN "latitude"       DOUBLE PRECISION,
  ADD COLUMN "longitude"      DOUBLE PRECISION,
  ADD COLUMN "whatsappNumber" TEXT,
  ADD COLUMN "about"          TEXT,
  ADD COLUMN "ownerName"      TEXT,
  ADD COLUMN "foundedYear"    INTEGER,
  ADD COLUMN "shopType"       TEXT,
  ADD COLUMN "instagramUrl"   TEXT,
  ADD COLUMN "facebookUrl"    TEXT,
  ADD COLUMN "tiktokUrl"      TEXT,
  ADD COLUMN "gallery"        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
