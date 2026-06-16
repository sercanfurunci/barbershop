import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Node.js serverless environments (Vercel) don't have a native WebSocket;
// neonConfig must be told which implementation to use before any Pool is created.
neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

// Lazy singleton — defer Pool construction to first query so
// process.env.DATABASE_URL is read at request time, not at module init.
let _client = null;
function getClient() {
  if (!_client) _client = createPrismaClient();
  return _client;
}

export const prisma = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  },
});
