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

  const barberData = [
    // WorkingHours stored as minutes from midnight (540 = 09:00, 600 = 10:00, 1080 = 18:00)
    { id: "brb-1", slug: "mehmet", nameTr: "Mehmet Yılmaz", nameEn: "Mehmet Yilmaz", titleTr: "Baş Berber", titleEn: "Master Barber", bioTr: "20 yıllık deneyim ile her kesimi bir sanat eseri olarak ele alır.", bioEn: "With 20 years of experience, treats every cut as a work of art.", avatar: "MY", yearsExp: 20, specialties: ["Fade", "Sakal", "Klasik Kesim"], hours: { monStart:540,monEnd:1140,tueStart:540,tueEnd:1140,wedStart:540,wedEnd:1140,thuStart:540,thuEnd:1140,friStart:540,friEnd:1140,satStart:600,satEnd:1020,sunStart:null,sunEnd:null } },
    { id: "brb-2", slug: "emre", nameTr: "Emre Kaya", nameEn: "Emre Kaya", titleTr: "Sakal Uzmanı", titleEn: "Beard Specialist", bioTr: "Sakal sanatını yeni bir seviyeye taşıyan deneyimli uzman.", bioEn: "Experienced specialist taking beard art to a new level.", avatar: "EK", yearsExp: 8, specialties: ["Sakal", "Ustura", "Şekillendirme"], hours: { monStart:600,monEnd:1200,tueStart:600,tueEnd:1200,wedStart:600,wedEnd:1200,thuStart:600,thuEnd:1200,friStart:600,friEnd:1200,satStart:600,satEnd:1080,sunStart:null,sunEnd:null } },
    { id: "brb-3", slug: "burak", nameTr: "Burak Demir", nameEn: "Burak Demir", titleTr: "Modern Kesim Uzmanı", titleEn: "Modern Cut Specialist", bioTr: "Trendy ve modern kesim teknikleriyle öne çıkan genç yetenekli berber.", bioEn: "Young talented barber standing out with trendy modern cutting techniques.", avatar: "BD", yearsExp: 5, specialties: ["Fade", "Tekstür", "Modern Stil"], hours: { monStart:540,monEnd:1080,tueStart:540,tueEnd:1080,wedStart:540,wedEnd:1080,thuStart:540,thuEnd:1080,friStart:540,friEnd:1080,satStart:540,satEnd:960,sunStart:null,sunEnd:null } },
    { id: "brb-4", slug: "can", nameTr: "Can Arslan", nameEn: "Can Arslan", titleTr: "Klasik Berber", titleEn: "Classic Barber", bioTr: "Geleneksel berberlerin ustası, klasik tekniklerde rakipsiz.", bioEn: "Master of traditional barbering, unmatched in classic techniques.", avatar: "CA", yearsExp: 12, specialties: ["Klasik", "Pompadour", "Vintage"], hours: { monStart:540,monEnd:1080,tueStart:540,tueEnd:1080,wedStart:540,wedEnd:1080,thuStart:540,thuEnd:1080,friStart:540,friEnd:1080,satStart:null,satEnd:null,sunStart:null,sunEnd:null } },
  ];

  for (const b of barberData) {
    const { hours, ...rest } = b;
    await prisma.barber.upsert({ where: { id: rest.id }, update: {}, create: rest });
    await prisma.workingHours.upsert({ where: { barberId: rest.id }, update: {}, create: { barberId: rest.id, ...hours } });
  }
  console.log("✓ Barbers");

  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({ where: { email: "admin@makas.com" }, update: {}, create: { email: "admin@makas.com", passwordHash: adminHash, role: "ADMIN" } });

  for (const [slug, id] of [["mehmet","brb-1"],["emre","brb-2"],["burak","brb-3"],["can","brb-4"]]) {
    const h = await bcrypt.hash("barber123", 10);
    await prisma.user.upsert({ where: { email: `${slug}@makas.com` }, update: {}, create: { email: `${slug}@makas.com`, passwordHash: h, role: "BARBER", barberId: id } });
  }
  console.log("✓ Users");

  console.log("\n✓ Seed complete");
  console.log("  Admin:  admin@makas.com / admin123");
  console.log("  Berber: mehmet@makas.com / barber123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
