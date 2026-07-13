import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

// GET  /api/customer/barber-favorites — list favorited barber IDs
export const GET = withAuth(async (request, _ctx, payload) => {

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
});

// POST /api/customer/barber-favorites
export const POST = withAuth(async (request, _ctx, payload) => {

  const { barberId } = await request.json();
  if (!barberId) return NextResponse.json({ error: "barberId gerekli" }, { status: 400 });

  const barber = await prisma.barber.findFirst({
    where: { id: barberId, available: true },
    select: { id: true },
  });
  if (!barber) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });

  await prisma.barberFavorite.upsert({
    where: { userId_barberId: { userId: payload.userId, barberId } },
    update: {},
    create: { userId: payload.userId, barberId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
});
