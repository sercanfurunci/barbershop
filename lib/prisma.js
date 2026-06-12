import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

// HTTP-based adapter — works reliably in Vercel serverless (no WebSocket pool).
function createPrismaClient() {
  const sql = neon(process.env.DATABASE_URL);
  const adapter = new PrismaNeonHttp(sql);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
