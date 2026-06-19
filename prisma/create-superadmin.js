import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const EMAIL    = process.env.SUPERADMIN_EMAIL;
const PASSWORD = process.env.SUPERADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env vars are required.");
  process.exit(1);
}
if (PASSWORD.length < 12) {
  console.error("SUPERADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.upsert({
    where:  { email: EMAIL },
    update: { role: "SUPER_ADMIN", shopId: null, passwordHash: hash },
    create: { email: EMAIL, role: "SUPER_ADMIN", shopId: null, passwordHash: hash },
  });
  console.log("✓ Super admin ready:", user.email);
  console.log("  (password not echoed for security)");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
