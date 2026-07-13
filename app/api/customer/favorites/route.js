import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withRole";

// GET /api/customer/favorites — list user's favorited shop IDs
export const GET = withAuth(async (request, _ctx, payload) => {

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
});

// POST /api/customer/favorites — add a favorite
export const POST = withAuth(async (request, _ctx, payload) => {

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
});
