import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");

  await Promise.all([
    prisma.service.upsert({ where: { id: "svc-1" }, update: {}, create: { id: "svc-1", nameTr: "Klasik Kesim", nameEn: "Classic Cut", descTr: "Zamansız kesim tekniği", descEn: "Timeless cut technique", duration: 30, price: 450, icon: "✂️", category: "CUTS", popular: true } }),
    prisma.service.upsert({ where: { id: "svc-2" }, update: {}, create: { id: "svc-2", nameTr: "Fade & Taper", nameEn: "Fade & Taper", descTr: "Gradyan geçiş", descEn: "Gradient blend", duration: 45, price: 550, icon: "💈", category: "CUTS" } }),
    prisma.service.upsert({ where: { id: "svc-3" }, update: {}, create: { id: "svc-3", nameTr: "Sakal Şekillendirme", nameEn: "Beard Sculpt", descTr: "Hassas sakal şekillendirme", descEn: "Precision beard sculpting", duration: 30, price: 350, icon: "🪒", category: "BEARD" } }),
    prisma.service.upsert({ where: { id: "svc-4" }, update: {}, create: { id: "svc-4", nameTr: "Kraliyet Tıraşı", nameEn: "Royal Shave", descTr: "Klasik ustura tıraşı", descEn: "Classic straight razor shave", duration: 45, price: 600, icon: "👑", category: "BEARD", popular: true } }),
    prisma.service.upsert({ where: { id: "svc-5" }, update: {}, create: { id: "svc-5", nameTr: "Kesim & Sakal", nameEn: "Cut & Beard", descTr: "Kombo bakım paketi", descEn: "Complete combo package", duration: 75, price: 750, icon: "⚡", category: "COMBO" } }),
    prisma.service.upsert({ where: { id: "svc-6" }, update: {}, create: { id: "svc-6", nameTr: "VIP Grooming", nameEn: "VIP Grooming", descTr: "Tam premium bakım deneyimi", descEn: "Full premium grooming experience", duration: 120, price: 1650, icon: "💎", category: "PREMIUM" } }),
  ]);
  console.log("✓ Services");

  // Working hours: 10:00-21:30 (600-1290), Sunday closed
  const wh = { monStart:600,monEnd:1290,tueStart:600,tueEnd:1290,wedStart:600,wedEnd:1290,thuStart:600,thuEnd:1290,friStart:600,friEnd:1290,satStart:600,satEnd:1290,sunStart:null,sunEnd:null };

  const barberData = [
    { id: "brb-1", slug: "abdurrahman", nameTr: "Abdurrahman Çelik", nameEn: "Abdurrahman Celik", titleTr: "Salon Sahibi & Baş Berber", titleEn: "Owner & Master Barber", bioTr: "Yılların deneyimi ve tutkusuyla her müşterisine özel bir bakım deneyimi sunar.", bioEn: "With years of experience and passion, offers a personalized grooming experience to every client.", avatar: "AÇ", yearsExp: 15, specialties: ["Fade", "Sakal", "Klasik Kesim"], hours: wh },
    { id: "brb-2", slug: "egemen",       nameTr: "Egemen Çelik",        nameEn: "Egemen Celik",        titleTr: "Kıdemli Berber",              titleEn: "Senior Barber",         bioTr: "Modern kesim teknikleri ve sakal tasarımında uzmanlaşmış deneyimli berber.", bioEn: "Experienced barber specializing in modern cutting techniques and beard design.", avatar: "EÇ", yearsExp: 8,  specialties: ["Modern Kesim", "Sakal", "Fade"], hours: wh },
    { id: "brb-3", slug: "omerefe",      nameTr: "Ömer Efe Furunci",    nameEn: "Omer Efe Furunci",    titleTr: "Berber",                     titleEn: "Barber",                bioTr: "Trendleri takip eden, yaratıcı ve dinamik berber.", bioEn: "Creative and dynamic barber who keeps up with the latest trends.", avatar: "ÖF", yearsExp: 4,  specialties: ["Tekstür", "Modern Stil", "Fade"], hours: wh },
    { id: "brb-4", slug: "emin",         nameTr: "Emin Fırtına",        nameEn: "Emin Firtina",        titleTr: "Berber",                     titleEn: "Barber",                bioTr: "Hassas çalışması ve müşteri memnuniyetine verdiği önemle tanınan genç berber.", bioEn: "Young barber known for his precise work and dedication to customer satisfaction.", avatar: "EF", yearsExp: 3,  specialties: ["Klasik Kesim", "Sakal", "Şekillendirme"], hours: wh },
  ];

  for (const b of barberData) {
    const { hours, ...rest } = b;
    await prisma.barber.upsert({ where: { id: rest.id }, update: {}, create: rest });
    await prisma.workingHours.upsert({ where: { barberId: rest.id }, update: {}, create: { barberId: rest.id, ...hours } });
  }
  console.log("✓ Barbers");

  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({ where: { email: "admin@makas.com" }, update: {}, create: { email: "admin@makas.com", passwordHash: adminHash, role: "ADMIN" } });

  for (const [slug, id] of [["abdurrahman","brb-1"],["egemen","brb-2"],["omerefe","brb-3"],["emin","brb-4"]]) {
    const h = await bcrypt.hash("barber123", 10);
    await prisma.user.upsert({ where: { email: `${slug}@makas.com` }, update: {}, create: { email: `${slug}@makas.com`, passwordHash: h, role: "BARBER", barberId: id } });
  }
  console.log("✓ Users");

  console.log("\n✓ Seed complete");
  console.log("  Admin:  admin@makas.com / admin123");
  console.log("  Berber: abdurrahman@makas.com / barber123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
