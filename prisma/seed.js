import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SHOP_ID   = "shop-abdurrahman";
const SHOP_SLUG = "abdurrahman";

async function main() {
  console.log("Seeding...");

  // ── Shop ───────────────────────────────────────────────────────────────
  await prisma.shop.upsert({
    where: { id: SHOP_ID },
    update: {},
    create: {
      id:          SHOP_ID,
      slug:        SHOP_SLUG,
      name:        "Abdurrahman Çelik Exclusive Salon",
      address:     "Darıca, Kocaeli, Türkiye",
      description: "Premium berber salonu — klasik tıraş, modern stil.",
      status:      "ACTIVE",
      timezone:    "Europe/Istanbul",
      currency:    "TRY",
    },
  });
  console.log("✓ Shop");

  // ── Services ───────────────────────────────────────────────────────────
  const services = [
    { id: "svc-1", nameTr: "Saç Kesimi",                 nameEn: "Haircut",                       descTr: "Klasik saç kesimi",            descEn: "Classic haircut",                   duration: 30,  price: 200,  icon: "✂️", category: "CUTS",    popular: true },
    { id: "svc-2", nameTr: "Sakal",                       nameEn: "Beard",                         descTr: "Sakal düzeltme ve şekillendirme", descEn: "Beard trim and shaping",         duration: 20,  price: 150,  icon: "🪒", category: "BEARD" },
    { id: "svc-3", nameTr: "Sakal & Saç",                 nameEn: "Beard & Haircut",               descTr: "Saç kesimi ve sakal birlikte", descEn: "Haircut and beard together",       duration: 45,  price: 350,  icon: "💈", category: "COMBO",   popular: true },
    { id: "svc-4", nameTr: "Saç + Sakal + Yıkama + Fön", nameEn: "Cut + Beard + Wash + Blowdry",  descTr: "Eksiksiz bakım paketi",         descEn: "Complete grooming package",        duration: 75,  price: 400,  icon: "💆", category: "COMBO" },
    { id: "svc-5", nameTr: "Maske",                       nameEn: "Mask",                          descTr: "Cilt bakım maskesi",           descEn: "Facial care mask",                  duration: 20,  price: 75,   icon: "🧴", category: "PREMIUM" },
    { id: "svc-6", nameTr: "Damat Tıraşı",                nameEn: "Groom Package",                 descTr: "Özel gün için tam bakım",       descEn: "Full treatment for your special day", duration: 120, price: 1500, icon: "🤵", category: "PREMIUM" },
  ];
  await Promise.all(services.map(s =>
    prisma.service.upsert({
      where:  { id: s.id },
      update: { ...s, shopId: SHOP_ID },
      create: { ...s, shopId: SHOP_ID },
    })
  ));
  console.log("✓ Services");

  // ── Barbers + working hours ────────────────────────────────────────────
  // 10:00-21:30 (600-1290), Sunday closed
  const wh = { monStart:600,monEnd:1290,tueStart:600,tueEnd:1290,wedStart:600,wedEnd:1290,thuStart:600,thuEnd:1290,friStart:600,friEnd:1290,satStart:600,satEnd:1290,sunStart:null,sunEnd:null };

  const barberData = [
    { id: "brb-1", slug: "abdurrahman", nameTr: "Abdurrahman Çelik", nameEn: "Abdurrahman Celik", titleTr: "Salon Sahibi & Baş Berber", titleEn: "Owner & Master Barber", bioTr: "Yılların deneyimi ve tutkusuyla her müşterisine özel bir bakım deneyimi sunar.", bioEn: "With years of experience and passion, offers a personalized grooming experience to every client.", avatar: "AÇ", yearsExp: 15, specialties: ["Fade", "Sakal", "Klasik Kesim"], hours: wh },
    { id: "brb-2", slug: "egemen",       nameTr: "Egemen Çelik",        nameEn: "Egemen Celik",        titleTr: "Kıdemli Berber",              titleEn: "Senior Barber",         bioTr: "Modern kesim teknikleri ve sakal tasarımında uzmanlaşmış deneyimli berber.", bioEn: "Experienced barber specializing in modern cutting techniques and beard design.", avatar: "EÇ", yearsExp: 8,  specialties: ["Modern Kesim", "Sakal", "Fade"], hours: wh },
    { id: "brb-3", slug: "omerefe",      nameTr: "Ömer Efe Furunci",    nameEn: "Omer Efe Furunci",    titleTr: "Berber",                     titleEn: "Barber",                bioTr: "Trendleri takip eden, yaratıcı ve dinamik berber.", bioEn: "Creative and dynamic barber who keeps up with the latest trends.", avatar: "ÖF", yearsExp: 4,  specialties: ["Tekstür", "Modern Stil", "Fade"], hours: wh },
    { id: "brb-4", slug: "emin",         nameTr: "Emin Fırtına",        nameEn: "Emin Firtina",        titleTr: "Berber",                     titleEn: "Barber",                bioTr: "Hassas çalışması ve müşteri memnuniyetine verdiği önemle tanınan genç berber.", bioEn: "Young barber known for his precise work and dedication to customer satisfaction.", avatar: "EF", yearsExp: 3,  specialties: ["Klasik Kesim", "Sakal", "Şekillendirme"], hours: wh },
  ];

  for (const b of barberData) {
    const { hours, ...rest } = b;
    await prisma.barber.upsert({
      where:  { id: rest.id },
      update: { ...rest, shopId: SHOP_ID },
      create: { ...rest, shopId: SHOP_ID },
    });
    await prisma.workingHours.upsert({ where: { barberId: rest.id }, update: {}, create: { barberId: rest.id, ...hours } });
  }
  console.log("✓ Barbers");

  // ── Users ──────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where:  { email: "admin@makas.com" },
    update: { shopId: SHOP_ID },
    create: { email: "admin@makas.com", passwordHash: adminHash, role: "ADMIN", shopId: SHOP_ID },
  });

  for (const [slug, id] of [["abdurrahman","brb-1"],["egemen","brb-2"],["omerefe","brb-3"],["emin","brb-4"]]) {
    const h = await bcrypt.hash("barber123", 10);
    await prisma.user.upsert({
      where:  { email: `${slug}@makas.com` },
      update: { shopId: SHOP_ID },
      create: { email: `${slug}@makas.com`, passwordHash: h, role: "BARBER", barberId: id, shopId: SHOP_ID },
    });
  }
  console.log("✓ Users");

  console.log("\n✓ Seed complete");
  console.log("  Admin:  admin@makas.com / admin123");
  console.log("  Berber: abdurrahman@makas.com / barber123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
