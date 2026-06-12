// Update working hours: 10:00-21:30 (600-1290), Sunday closed
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const hours = {
  monStart:600, monEnd:1290,
  tueStart:600, tueEnd:1290,
  wedStart:600, wedEnd:1290,
  thuStart:600, thuEnd:1290,
  friStart:600, friEnd:1290,
  satStart:600, satEnd:1290,
  sunStart:null, sunEnd:null,
};

async function main() {
  const barbers = await prisma.barber.findMany({ select: { id: true, nameTr: true } });
  for (const b of barbers) {
    await prisma.workingHours.upsert({
      where: { barberId: b.id },
      update: hours,
      create: { barberId: b.id, ...hours },
    });
    console.log(`✓ ${b.nameTr}`);
  }
  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
