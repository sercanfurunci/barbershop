import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET  /api/customer/barber-favorites — list favorited barber IDs
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favs = await prisma.barberFavorite.findMany({
    where: { userId: payload.userId },
    select: {
      barberId: true,
      createdAt: true,
      barber: {
        select: {
          id: true, slug: true, nameTr: true, titleTr: true,
          avatar: true, rating: true, reviewCount: true,
          shop: { select: { id: true, slug: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favs);
}

// POST /api/customer/barber-favorites
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { barberId } = await request.json();
  if (!barberId) return NextResponse.json({ error: "barberId gerekli" }, { status: 400 });

  const barber = await prisma.barber.findFirst({
    where: { id: barberId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!barber) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });

  await prisma.barberFavorite.upsert({
    where: { userId_barberId: { userId: payload.userId, barberId } },
    update: {},
    create: { userId: payload.userId, barberId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
