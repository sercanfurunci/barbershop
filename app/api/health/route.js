import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks = {};
  let overall = "ok";

  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch {
    checks.database = { ok: false, error: "Database unavailable" };
    overall = "down";
  }

  if (process.env.UPSTASH_REDIS_REST_URL) {
    const redisStart = Date.now();
    try {
      const resp = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        signal: AbortSignal.timeout(3000),
      });
      checks.redis = { ok: resp.ok, latencyMs: Date.now() - redisStart };
      if (!resp.ok && overall === "ok") overall = "degraded";
    } catch {
      checks.redis = { ok: false, error: "Redis unreachable" };
      if (overall === "ok") overall = "degraded";
    }
  }

  return NextResponse.json(
    { status: overall, checks, version: process.env.npm_package_version ?? "unknown", uptime: process.uptime() },
    { status: overall === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } }
  );
}
