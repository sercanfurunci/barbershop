// One-time migration: move base64 profilePhotos from DB → Cloudinary.
// Run: node prisma/migrate-photos.js
// Requires .env.local with CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.

import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  console.error("❌  CLOUDINARY_CLOUD_NAME not set in .env.local");
  process.exit(1);
}

const barbers = await prisma.barber.findMany({
  where:  { profilePhoto: { startsWith: "data:image/" } },
  select: { id: true, slug: true },
});

console.log(`Found ${barbers.length} barber(s) with base64 photos to migrate.\n`);

let ok = 0, fail = 0;
for (const b of barbers) {
  const full = await prisma.barber.findUnique({ where: { id: b.id }, select: { profilePhoto: true } });
  try {
    const result = await cloudinary.uploader.upload(full.profilePhoto, {
      public_id:     `makas/barbers/${b.id}`,
      overwrite:     true,
      resource_type: "image",
      transformation: [
        { width: 800, height: 800, crop: "fill", gravity: "auto" },
        { quality: "auto:good", fetch_format: "auto" },
      ],
    });
    await prisma.barber.update({ where: { id: b.id }, data: { profilePhoto: result.secure_url } });
    console.log(`  ✓  ${b.slug} → ${result.secure_url}`);
    ok++;
  } catch (err) {
    console.error(`  ✗  ${b.slug}: ${err.message}`);
    fail++;
  }
}

await prisma.$disconnect();
console.log(`\nDone. ${ok} migrated, ${fail} failed.`);
