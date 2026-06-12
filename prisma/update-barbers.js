// One-time script: update barber names/slugs to real staff
// Keeps same IDs so existing appointments are preserved

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const barbers = [
  {
    id: "brb-1",
    slug: "abdurrahman",
    nameTr: "Abdurrahman Çelik",
    nameEn: "Abdurrahman Celik",
    titleTr: "Salon Sahibi & Baş Berber",
    titleEn: "Owner & Master Barber",
    bioTr: "Yılların deneyimi ve tutkusuyla her müşterisine özel bir bakım deneyimi sunar.",
    bioEn: "With years of experience and passion, offers a personalized grooming experience to every client.",
    avatar: "AÇ",
    oldEmail: "mehmet@makas.com",
    newEmail: "abdurrahman@makas.com",
  },
  {
    id: "brb-2",
    slug: "egemen",
    nameTr: "Egemen Çelik",
    nameEn: "Egemen Celik",
    titleTr: "Kıdemli Berber",
    titleEn: "Senior Barber",
    bioTr: "Modern kesim teknikleri ve sakal tasarımında uzmanlaşmış deneyimli berber.",
    bioEn: "Experienced barber specializing in modern cutting techniques and beard design.",
    avatar: "EÇ",
    oldEmail: "emre@makas.com",
    newEmail: "egemen@makas.com",
  },
  {
    id: "brb-3",
    slug: "omerefe",
    nameTr: "Ömer Efe Furunci",
    nameEn: "Omer Efe Furunci",
    titleTr: "Berber",
    titleEn: "Barber",
    bioTr: "Trendleri takip eden, yaratıcı ve dinamik berber.",
    bioEn: "Creative and dynamic barber who keeps up with the latest trends.",
    avatar: "ÖF",
    oldEmail: "burak@makas.com",
    newEmail: "omerefe@makas.com",
  },
  {
    id: "brb-4",
    slug: "emin",
    nameTr: "Emin Fırtına",
    nameEn: "Emin Firtina",
    titleTr: "Berber",
    titleEn: "Barber",
    bioTr: "Hassas çalışması ve müşteri memnuniyetine verdiği önemle tanınan genç berber.",
    bioEn: "Young barber known for his precise work and dedication to customer satisfaction.",
    avatar: "EF",
    oldEmail: "can@makas.com",
    newEmail: "emin@makas.com",
  },
];

async function main() {
  console.log("Updating barbers...");

  for (const b of barbers) {
    const { id, slug, nameTr, nameEn, titleTr, titleEn, bioTr, bioEn, avatar, oldEmail, newEmail } = b;

    await prisma.barber.update({
      where: { id },
      data: { slug, nameTr, nameEn, titleTr, titleEn, bioTr, bioEn, avatar },
    });
    console.log(`  ✓ Barber updated: ${nameTr} (${slug})`);

    // Update user email
    const user = await prisma.user.findUnique({ where: { email: oldEmail } });
    if (user) {
      await prisma.user.update({ where: { email: oldEmail }, data: { email: newEmail } });
      console.log(`  ✓ User email: ${oldEmail} → ${newEmail}`);
    } else {
      // User might not exist yet — create one
      const hash = await bcrypt.hash("barber123", 10);
      await prisma.user.upsert({
        where: { email: newEmail },
        update: {},
        create: { email: newEmail, passwordHash: hash, role: "BARBER", barberId: id },
      });
      console.log(`  ✓ User created: ${newEmail}`);
    }
  }

  console.log("\n✓ Done.");
  console.log("  Giriş bilgileri (şifre değişmedi): barber123");
  barbers.forEach(b => console.log(`  ${b.newEmail}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
