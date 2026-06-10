/**
 * One-time migration: convert WorkingHours from hours (9) to minutes (540).
 * Run once after deploying the new schema: node prisma/migrate-v2.js
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];

async function main() {
  const rows = await prisma.workingHours.findMany();
  console.log(`Found ${rows.length} WorkingHours rows to migrate`);

  for (const row of rows) {
    const update = {};
    for (const day of DAYS) {
      const s = row[`${day}Start`];
      const e = row[`${day}End`];
      // Only convert if value looks like an hour (1–23), not already in minutes (>= 60)
      if (s != null && s < 60) update[`${day}Start`] = s * 60;
      if (e != null && e < 60) update[`${day}End`]   = e * 60;
    }
    if (Object.keys(update).length > 0) {
      await prisma.workingHours.update({ where: { id: row.id }, data: update });
      console.log(`  ✓ Barber ${row.barberId} updated`);
    } else {
      console.log(`  — Barber ${row.barberId} already in minutes format, skipped`);
    }
  }

  console.log("\n✓ Migration complete");
}

main().catch(console.error).finally(() => prisma.$disconnect());
