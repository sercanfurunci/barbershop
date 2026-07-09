import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

const COVER_STYLES = new Set(["auto", "custom", "gallery_hero", "logo_hero", "no_hero"]);

// GET /api/admin/shop/mobile-settings
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") return forbidden();
  if (!payload.shopId) return forbidden();

  const shop = await prisma.shop.findUnique({
    where: { id: payload.shopId },
    select: { mobileSettings: true, featuredImage: true, gallery: true, coverImage: true, logo: true },
  });
  return NextResponse.json(shop);
}

// PATCH /api/admin/shop/mobile-settings
// body: { mobileSettings?, featuredImage? }
export async function PATCH(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") return forbidden();
  if (!payload.shopId) return forbidden();

  const body = await request.json();
  const data = {};

  if (body.featuredImage !== undefined) {
    data.featuredImage = body.featuredImage || null;
  }

  if (body.mobileSettings !== undefined) {
    // Fetch current to merge (patch semantics)
    const current = await prisma.shop.findUnique({
      where: { id: payload.shopId },
      select: { mobileSettings: true },
    });
    const existing = (current?.mobileSettings ?? {});
    const incoming = body.mobileSettings;

    // Validate coverStyle if present
    if (incoming.coverStyle && !COVER_STYLES.has(incoming.coverStyle)) {
      return NextResponse.json({ error: "Geçersiz coverStyle" }, { status: 400 });
    }

    data.mobileSettings = { ...existing, ...incoming };
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const updated = await prisma.shop.update({
    where: { id: payload.shopId },
    data,
    select: { mobileSettings: true, featuredImage: true },
  });
  return NextResponse.json(updated);
}
