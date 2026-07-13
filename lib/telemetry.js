/**
 * Lightweight timing helpers for Prisma queries and API handlers.
 * Logs slow operations (> threshold) to stdout as structured JSON.
 */

const SLOW_DB_MS = 200;
const SLOW_API_MS = 2000;

export async function measureDb(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    if (ms > SLOW_DB_MS) {
      console.warn(JSON.stringify({ type: "slow_query", query: name, ms, time: new Date().toISOString() }));
    }
    return result;
  } catch (err) {
    console.error(JSON.stringify({ type: "query_error", query: name, error: err.message }));
    throw err;
  }
}

export async function measureApi(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    if (ms > SLOW_API_MS) {
      console.warn(JSON.stringify({ type: "slow_api", handler: name, ms, time: new Date().toISOString() }));
    }
    return result;
  } catch (err) {
    throw err;
  }
}
