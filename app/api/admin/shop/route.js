import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN"];

function guard(payload) {
  if (!payload) return { error: unauthorized() };
  if (!ALLOWED_ROLES.includes(payload.role)) return { error: forbidden() };
  if (payload.role === "SUPER_ADMIN") return { shopId: null };
  if (!payload.shopId) return { error: forbidden() };
  return { shopId: payload.shopId };
}

// GET /api/admin/shop — returns current shop settings
export async function GET(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const shopId = g.shopId ?? new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      id: true, name: true, slug: true, address: true, phone: true,
      email: true, description: true, social: true,
      googlePlaceId: true, googlePlacesKey: true, mapsEmbed: true,
      timezone: true, currency: true, status: true,
    },
  });

  if (!shop) return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
  return NextResponse.json(shop);
}

// PATCH /api/admin/shop — update shop settings
export async function PATCH(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const shopId = g.shopId ?? new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const body = await request.json().catch(() => ({}));

  const data = {};
  if (body.name        !== undefined) data.name        = String(body.name).trim().slice(0, 120);
  if (body.address     !== undefined) data.address     = body.address     ? String(body.address).trim().slice(0, 500)     : null;
  if (body.phone       !== undefined) data.phone       = body.phone       ? String(body.phone).trim().slice(0, 30)        : null;
  if (body.email       !== undefined) data.email       = body.email       ? String(body.email).trim().slice(0, 120)       : null;
  if (body.description !== undefined) data.description = body.description ? String(body.description).trim().slice(0, 2000): null;
  if (body.mapsEmbed   !== undefined) data.mapsEmbed   = body.mapsEmbed   ? String(body.mapsEmbed).trim().slice(0, 1000)  : null;

  if (body.googlePlaceId  !== undefined) data.googlePlaceId  = body.googlePlaceId  ? String(body.googlePlaceId).trim()  : null;
  if (body.googlePlacesKey !== undefined) data.googlePlacesKey = body.googlePlacesKey ? String(body.googlePlacesKey).trim() : null;

  // Social links — only allow known keys
  if (body.social !== undefined && body.social && typeof body.social === "object") {
    const { instagram, facebook, tiktok, twitter, website } = body.social;
    data.social = {
      instagram: instagram ? String(instagram).trim().slice(0, 200) : null,
      facebook:  facebook  ? String(facebook).trim().slice(0, 200)  : null,
      tiktok:    tiktok    ? String(tiktok).trim().slice(0, 200)    : null,
      twitter:   twitter   ? String(twitter).trim().slice(0, 200)   : null,
      website:   website   ? String(website).trim().slice(0, 200)   : null,
    };
  }

  if (!data.name && body.name !== undefined) {
    return NextResponse.json({ error: "Salon adı boş olamaz" }, { status: 400 });
  }

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data,
    select: {
      id: true, name: true, slug: true, address: true, phone: true,
      email: true, description: true, social: true,
      googlePlaceId: true, googlePlacesKey: true, mapsEmbed: true,
    },
  });

  return NextResponse.json(shop);
}
