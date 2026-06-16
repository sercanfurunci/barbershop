import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[prisma] DATABASE_URL is not set at client creation time");
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
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
