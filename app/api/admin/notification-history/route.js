import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN" && payload.role !== "RECEPTIONIST") return forbidden();

  const { searchParams } = new URL(request.url);
  const shopId = payload.role === "SUPER_ADMIN"
    ? (searchParams.get("shopId") ?? null)
    : payload.shopId;

  if (!shopId) return NextResponse.json([]);

  const status  = searchParams.get("status");
  const channel = searchParams.get("channel");
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset  = parseInt(searchParams.get("offset") ?? "0");

  const where = {
    shopId,
    ...(status  && { status }),
    ...(channel && { channel }),
  };

  const [jobs, total] = await Promise.all([
    prisma.notificationJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        appointment: {
          select: { date: true, time: true, client: { select: { name: true, phone: true } } },
        },
      },
    }),
    prisma.notificationJob.count({ where }),
  ]);

  return NextResponse.json({ jobs, total });
}
