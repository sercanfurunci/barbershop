// Demo tenant seed — /demo'yu canlı bir salon gibi gösterir.
// Kullanım: node prisma/seed-demo.js
// Diğer tenant'lara dokunmaz; sadece "demo" slug'ını upsert eder.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const SHOP_ID = "shop-demo";
const SLUG = "demo";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ymd = (d) => d.toISOString().slice(0, 10);
const hhmm = (h, m = 0) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const pick = (arr, i) => arr[i % arr.length];
const rand = (seed) => { let s = seed | 0; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };

// Mon-Sat 10:00-21:30, Sunday closed
const HOURS = {
  monStart: 600, monEnd: 1290, tueStart: 600, tueEnd: 1290,
  wedStart: 600, wedEnd: 1290, thuStart: 600, thuEnd: 1290,
  friStart: 600, friEnd: 1290, satStart: 600, satEnd: 1290,
  sunStart: null, sunEnd: null,
};

const SERVICES = [
  { id: "demo-svc-1", nameTr: "Saç Kesimi",       nameEn: "Haircut",          descTr: "Klasik saç kesimi",                  descEn: "Classic haircut",          duration: 30,  price: 250,  icon: "✂️", category: "CUTS",    popular: true,  sortOrder: 1 },
  { id: "demo-svc-2", nameTr: "Sakal Tıraşı",     nameEn: "Beard Trim",       descTr: "Sakal düzeltme ve şekillendirme",    descEn: "Beard trim and shape",     duration: 20,  price: 180,  icon: "🪒", category: "BEARD",   sortOrder: 2 },
  { id: "demo-svc-3", nameTr: "Saç + Sakal",      nameEn: "Haircut + Beard",  descTr: "Saç kesimi ve sakal birlikte",       descEn: "Haircut & beard combo",    duration: 45,  price: 400,  icon: "💈", category: "COMBO",   popular: true,  sortOrder: 3 },
  { id: "demo-svc-4", nameTr: "Komple Bakım",     nameEn: "Full Grooming",    descTr: "Saç, sakal, yıkama ve fön",          descEn: "Cut, beard, wash & blow",  duration: 75,  price: 550,  icon: "💆", category: "COMBO",   sortOrder: 4 },
  { id: "demo-svc-5", nameTr: "Cilt Maskesi",     nameEn: "Skin Mask",        descTr: "Yatıştırıcı cilt bakım maskesi",     descEn: "Soothing skin care mask",  duration: 20,  price: 100,  icon: "🧴", category: "PREMIUM", sortOrder: 5 },
  { id: "demo-svc-6", nameTr: "Damat Paketi",     nameEn: "Groom Package",    descTr: "Özel gün için tam bakım paketi",     descEn: "Full grooming for big day",duration: 120, price: 1800, icon: "🤵", category: "PREMIUM", sortOrder: 6 },
  { id: "demo-svc-7", nameTr: "Çocuk Kesimi",     nameEn: "Kids Haircut",     descTr: "0-12 yaş için saç kesimi",           descEn: "Haircut for kids 0-12",    duration: 25,  price: 200,  icon: "🧒", category: "CUTS",    sortOrder: 7 },
  { id: "demo-svc-8", nameTr: "Saç Yıkama",       nameEn: "Hair Wash",        descTr: "Profesyonel saç yıkama",             descEn: "Professional hair wash",   duration: 15,  price: 80,   icon: "🚿", category: "CUTS",    sortOrder: 8 },
];

const BARBERS = [
  { id: "demo-brb-1", slug: "mehmet", nameTr: "Mehmet Yılmaz", nameEn: "Mehmet Yilmaz", titleTr: "Salon Sahibi & Baş Berber", titleEn: "Owner & Master Barber", bioTr: "20 yıllık deneyimle modern ve klasik kesimlerde uzman.",            bioEn: "Master of modern and classic cuts with 20 years of experience.", avatar: "MY", yearsExp: 20, rating: 4.9, reviewCount: 184, specialties: ["Klasik Kesim", "Fade", "Sakal Tasarımı"] },
  { id: "demo-brb-2", slug: "ahmet",   nameTr: "Ahmet Demir",   nameEn: "Ahmet Demir",   titleTr: "Kıdemli Berber",            titleEn: "Senior Barber",         bioTr: "Fade ve skin cut konusunda uzman, detaycı çalışma tarzı ile tanınır.", bioEn: "Specialist in fade and skin cut, known for his meticulous work.", avatar: "AD", yearsExp: 10, rating: 4.8, reviewCount: 127, specialties: ["Fade", "Skin Cut", "Modern Stil"] },
  { id: "demo-brb-3", slug: "burak",   nameTr: "Burak Aydın",   nameEn: "Burak Aydin",   titleTr: "Berber",                    titleEn: "Barber",                bioTr: "Trendleri yakından takip eden, genç ve dinamik berber.",               bioEn: "Young, dynamic barber who keeps up with current trends.",         avatar: "BA", yearsExp: 5,  rating: 4.7, reviewCount: 78,  specialties: ["Tekstür", "Modern Kesim", "Sakal"] },
  { id: "demo-brb-4", slug: "can",     nameTr: "Can Şahin",     nameEn: "Can Sahin",     titleTr: "Berber",                    titleEn: "Barber",                bioTr: "Müşteri memnuniyetine verdiği önemle bilinen titiz berber.",          bioEn: "Detail-oriented barber known for prioritizing customer satisfaction.", avatar: "CŞ", yearsExp: 3,  rating: 4.7, reviewCount: 46,  specialties: ["Klasik Kesim", "Çocuk Kesimi", "Sakal"] },
];

const CLIENTS = [
  ["Murat Kara",        "05551234501"], ["Ali Doğan",       "05551234502"],
  ["Hasan Çelik",       "05551234503"], ["Mustafa Şen",     "05551234504"],
  ["Ömer Aslan",        "05551234505"], ["Hakan Polat",     "05551234506"],
  ["Burak Yıldız",      "05551234507"], ["Emre Kaya",       "05551234508"],
  ["Serkan Özkan",      "05551234509"], ["Onur Güneş",      "05551234510"],
  ["Tolga Demir",       "05551234511"], ["Cem Erdoğan",     "05551234512"],
  ["Berk Sönmez",       "05551234513"], ["Kerem Yalçın",    "05551234514"],
  ["Furkan Acar",       "05551234515"], ["Selim Bozkurt",   "05551234516"],
  ["Ergin Akın",        "05551234517"], ["Yusuf Avcı",      "05551234518"],
  ["Doğukan Çetin",     "05551234519"], ["Eren Bal",        "05551234520"],
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding /demo tenant…");

  await prisma.shop.upsert({
    where: { id: SHOP_ID },
    update: { status: "ACTIVE" },
    create: {
      id: SHOP_ID, slug: SLUG,
      name: "MAKAS Demo Salon",
      address: "Bağdat Caddesi No: 142, Kadıköy, İstanbul",
      phone: "+90 544 745 57 08",
      email: "demo@makas.tech",
      description: "Premium berber deneyimi — demo salonu. Gerçek bir randevu sayfası nasıl görünür?",
      status: "ACTIVE",
      timezone: "Europe/Istanbul",
      currency: "TRY",
      social: { instagram: "@makasdemo" },
    },
  });
  console.log("✓ Shop");

  for (const s of SERVICES) {
    await prisma.service.upsert({
      where: { id: s.id }, update: { ...s, shopId: SHOP_ID }, create: { ...s, shopId: SHOP_ID },
    });
  }
  console.log("✓ Services");

  for (const b of BARBERS) {
    await prisma.barber.upsert({
      where: { id: b.id }, update: { ...b, shopId: SHOP_ID }, create: { ...b, shopId: SHOP_ID },
    });
    await prisma.workingHours.upsert({
      where: { barberId: b.id }, update: HOURS, create: { barberId: b.id, ...HOURS },
    });
    // All barbers do all services
    for (const s of SERVICES) {
      await prisma.barberService.upsert({
        where: { barberId_serviceId: { barberId: b.id, serviceId: s.id } },
        update: {}, create: { barberId: b.id, serviceId: s.id },
      });
    }
  }
  console.log("✓ Barbers + services");

  // Users (admin + per-barber)
  const adminHash = await bcrypt.hash("demo123", 10);
  await prisma.user.upsert({
    where: { email: "demo-admin@makas.tech" },
    update: { shopId: SHOP_ID },
    create: { email: "demo-admin@makas.tech", passwordHash: adminHash, role: "ADMIN", shopId: SHOP_ID },
  });
  for (const b of BARBERS) {
    const h = await bcrypt.hash("demo123", 10);
    await prisma.user.upsert({
      where: { email: `demo-${b.slug}@makas.tech` },
      update: { shopId: SHOP_ID },
      create: { email: `demo-${b.slug}@makas.tech`, passwordHash: h, role: "BARBER", barberId: b.id, shopId: SHOP_ID },
    });
  }
  console.log("✓ Users");

  // Clients
  const clientIds = [];
  for (const [name, phone] of CLIENTS) {
    const c = await prisma.client.upsert({
      where: { shopId_phone: { shopId: SHOP_ID, phone } },
      update: { name },
      create: { shopId: SHOP_ID, name, phone },
    });
    clientIds.push(c.id);
  }
  console.log(`✓ Clients (${clientIds.length})`);

  // Appointments — past 14d completed, today filled, next 7d upcoming
  const rng = rand(42);
  const SLOTS = [hhmm(10), hhmm(10,30), hhmm(11), hhmm(11,30), hhmm(12), hhmm(13), hhmm(13,30), hhmm(14), hhmm(14,30), hhmm(15), hhmm(15,30), hhmm(16), hhmm(16,30), hhmm(17), hhmm(17,30), hhmm(18), hhmm(18,30), hhmm(19), hhmm(19,30), hhmm(20)];
  let created = 0;

  for (let dayOffset = -14; dayOffset <= 7; dayOffset++) {
    const d = addDays(dayOffset);
    if (d.getDay() === 0) continue; // Sunday closed
    const date = ymd(d);

    // Density: past ~6/day per barber, today ~5, future ~3
    const perBarber = dayOffset < 0 ? 6 : dayOffset === 0 ? 5 : 3;

    for (const b of BARBERS) {
      const usedSlots = new Set();
      for (let i = 0; i < perBarber; i++) {
        let slotIdx;
        let guard = 0;
        do { slotIdx = Math.floor(rng() * SLOTS.length); guard++; }
        while (usedSlots.has(slotIdx) && guard < 20);
        if (usedSlots.has(slotIdx)) break;
        usedSlots.add(slotIdx);

        const svc = pick(SERVICES, Math.floor(rng() * SERVICES.length));
        const client = pick(clientIds, Math.floor(rng() * clientIds.length));
        const time = SLOTS[slotIdx];

        const status =
          dayOffset < -1 ? (rng() < 0.92 ? "COMPLETED" : rng() < 0.5 ? "CANCELLED" : "NOSHOW")
          : dayOffset < 0 ? "COMPLETED"
          : dayOffset === 0 ? (rng() < 0.5 ? "CONFIRMED" : "PENDING")
          : (rng() < 0.6 ? "CONFIRMED" : "PENDING");

        try {
          await prisma.appointment.create({
            data: {
              shopId: SHOP_ID, clientId: client, barberId: b.id, serviceId: svc.id,
              date, time, duration: svc.duration, price: svc.price,
              status, source: rng() < 0.7 ? "ONLINE" : "WALKIN",
            },
          });
          created++;
        } catch (_) { /* unique collision — skip silently */ }
      }
    }
  }
  console.log(`✓ Appointments (${created})`);

  console.log("\n✓ Demo seed complete");
  console.log("  Shop:    /demo");
  console.log("  Admin:   demo-admin@makas.tech / demo123");
  console.log("  Berber:  demo-mehmet@makas.tech / demo123");
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
