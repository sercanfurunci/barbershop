import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// HTTP-based adapter — reliable in Vercel serverless (no WebSocket pool).
function createPrismaClient() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
