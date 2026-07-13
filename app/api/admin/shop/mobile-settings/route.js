import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];
const COVER_STYLES = new Set(["auto", "custom", "gallery_hero", "logo_hero", "no_hero"]);

// GET /api/admin/shop/mobile-settings
export const GET = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  // SUPER_ADMIN must pass ?shopId= since they have no default shopId
  const shopId = payload.shopId;
  if (!shopId) return forbidden();

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { mobileSettings: true, featuredImage: true, gallery: true, coverImage: true, logo: true },
  });
  return NextResponse.json(shop);
});

// PATCH /api/admin/shop/mobile-settings
// body: { mobileSettings?, featuredImage? }
export const PATCH = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = payload.shopId;
  if (!shopId) return forbidden();

  const body = await request.json();
  const data = {};

  if (body.featuredImage !== undefined) {
    data.featuredImage = body.featuredImage || null;
  }

  if (body.mobileSettings !== undefined) {
    // Fetch current to merge (patch semantics)
    const current = await prisma.shop.findUnique({
      where: { id: shopId },
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
    where: { id: shopId },
    data,
    select: { mobileSettings: true, featuredImage: true },
  });
  return NextResponse.json(updated);
});
