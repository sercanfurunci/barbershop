import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/customer/favorites — list user's favorited shop IDs
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const favs = await prisma.customerFavorite.findMany({
    where: { userId: payload.userId },
    select: {
      shopId: true,
      createdAt: true,
      shop: {
        select: {
          id: true, slug: true, name: true, city: true, addressLine: true,
          logo: true, coverImage: true, googleRating: true, googleTotalRatings: true,
          googleRating: true, googleTotalRatings: true, phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favs);
}

// POST /api/customer/favorites — add a favorite
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopId } = await request.json();
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });

  await prisma.customerFavorite.upsert({
    where: { userId_shopId: { userId: payload.userId, shopId } },
    update: {},
    create: { userId: payload.userId, shopId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
