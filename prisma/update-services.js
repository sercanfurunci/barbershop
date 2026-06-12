import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const services = [
  {
    id: "svc-1",
    nameTr: "Saç Kesimi",
    nameEn: "Haircut",
    descTr: "Klasik saç kesimi",
    descEn: "Classic haircut",
    duration: 30,
    price: 200,
    icon: "✂️",
    category: "CUTS",
    popular: true,
    active: true,
  },
  {
    id: "svc-2",
    nameTr: "Sakal",
    nameEn: "Beard",
    descTr: "Sakal düzeltme ve şekillendirme",
    descEn: "Beard trim and shaping",
    duration: 20,
    price: 150,
    icon: "🪒",
    category: "BEARD",
    popular: false,
    active: true,
  },
  {
    id: "svc-3",
    nameTr: "Sakal & Saç",
    nameEn: "Beard & Haircut",
    descTr: "Saç kesimi ve sakal birlikte",
    descEn: "Haircut and beard together",
    duration: 45,
    price: 350,
    icon: "💈",
    category: "COMBO",
    popular: true,
    active: true,
  },
  {
    id: "svc-4",
    nameTr: "Saç + Sakal + Yıkama + Fön",
    nameEn: "Cut + Beard + Wash + Blowdry",
    descTr: "Eksiksiz bakım paketi",
    descEn: "Complete grooming package",
    duration: 75,
    price: 400,
    icon: "💆",
    category: "COMBO",
    popular: false,
    active: true,
  },
  {
    id: "svc-5",
    nameTr: "Maske",
    nameEn: "Mask",
    descTr: "Cilt bakım maskesi",
    descEn: "Facial care mask",
    duration: 20,
    price: 75,
    icon: "🧴",
    category: "PREMIUM",
    popular: false,
    active: true,
  },
  {
    id: "svc-6",
    nameTr: "Damat Tıraşı",
    nameEn: "Groom Package",
    descTr: "Özel gün için tam bakım",
    descEn: "Full treatment for your special day",
    duration: 120,
    price: 1500,
    icon: "🤵",
    category: "PREMIUM",
    popular: false,
    active: true,
  },
];

async function main() {
  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: svc,
      create: svc,
    });
    console.log(`✓ ${svc.nameTr}`);
  }
  console.log("\nDone.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
