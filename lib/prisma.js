import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { createRequire } from "module";

// WebSocket polyfill for Node.js environments (local dev / Vercel Node runtime)
if (typeof WebSocket === "undefined") {
  const _require = createRequire(import.meta.url);
  neonConfig.webSocketConstructor = _require("ws");
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
