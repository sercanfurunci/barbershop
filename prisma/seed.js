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
    { id: "brb-1", slug: "mehmet", nameTr: "Mehmet Yılmaz", nameEn: "Mehmet Yilmaz", titleTr: "Baş Berber", titleEn: "Master Barber", bioTr: "20 yıllık deneyim ile her kesimi bir sanat eseri olarak ele alır.", bioEn: "With 20 years of experience, treats every cut as a work of art.", avatar: "MY", yearsExp: 20, specialties: ["Fade", "Sakal", "Klasik Kesim"], hours: { monStart:9,monEnd:19,tueStart:9,tueEnd:19,wedStart:9,wedEnd:19,thuStart:9,thuEnd:19,friStart:9,friEnd:19,satStart:10,satEnd:17,sunStart:null,sunEnd:null } },
    { id: "brb-2", slug: "emre", nameTr: "Emre Kaya", nameEn: "Emre Kaya", titleTr: "Sakal Uzmanı", titleEn: "Beard Specialist", bioTr: "Sakal sanatını yeni bir seviyeye taşıyan deneyimli uzman.", bioEn: "Experienced specialist taking beard art to a new level.", avatar: "EK", yearsExp: 8, specialties: ["Sakal", "Ustura", "Şekillendirme"], hours: { monStart:10,monEnd:20,tueStart:10,tueEnd:20,wedStart:10,wedEnd:20,thuStart:10,thuEnd:20,friStart:10,friEnd:20,satStart:10,satEnd:18,sunStart:null,sunEnd:null } },
    { id: "brb-3", slug: "burak", nameTr: "Burak Demir", nameEn: "Burak Demir", titleTr: "Modern Kesim Uzmanı", titleEn: "Modern Cut Specialist", bioTr: "Trendy ve modern kesim teknikleriyle öne çıkan genç yetenekli berber.", bioEn: "Young talented barber standing out with trendy modern cutting techniques.", avatar: "BD", yearsExp: 5, specialties: ["Fade", "Tekstür", "Modern Stil"], hours: { monStart:9,monEnd:18,tueStart:9,tueEnd:18,wedStart:9,wedEnd:18,thuStart:9,thuEnd:18,friStart:9,friEnd:18,satStart:9,satEnd:16,sunStart:null,sunEnd:null } },
    { id: "brb-4", slug: "can", nameTr: "Can Arslan", nameEn: "Can Arslan", titleTr: "Klasik Berber", titleEn: "Classic Barber", bioTr: "Geleneksel berberlerin ustası, klasik tekniklerde rakipsiz.", bioEn: "Master of traditional barbering, unmatched in classic techniques.", avatar: "CA", yearsExp: 12, specialties: ["Klasik", "Pompadour", "Vintage"], hours: { monStart:9,monEnd:18,tueStart:9,tueEnd:18,wedStart:9,wedEnd:18,thuStart:9,thuEnd:18,friStart:9,friEnd:18,satStart:null,satEnd:null,sunStart:null,sunEnd:null } },
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
