import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/middleware/withRole";

const VALID_CATEGORIES = ["CUTS", "BEARD", "COMBO", "PREMIUM"];
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

// GET /api/admin/services — all services for this shop (including inactive)
export const GET = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.toLowerCase() ?? "";

  const shopId = payload.role === "SUPER_ADMIN"
    ? searchParams.get("shopId")
    : payload.shopId;
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });
  const where = { shopId };
  const services = await prisma.service.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { price: "asc" }],
  });

  const filtered = search
    ? services.filter((s) =>
        s.nameTr.toLowerCase().includes(search) ||
        s.nameEn.toLowerCase().includes(search),
      )
    : services;

  return NextResponse.json(filtered);
});

// POST /api/admin/services
// body: { nameTr, nameEn?, descTr?, descEn?, duration, price, icon?, category, popular?, active?, sortOrder? }
export const POST = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const body = await request.json();
  const { nameTr, nameEn, descTr, descEn, duration, price, icon, category, popular, active, sortOrder } = body;

  if (!nameTr || !duration || !category) {
    return NextResponse.json({ error: "nameTr, duration ve category zorunlu" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Geçersiz kategori. Seçenekler: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
  }
  // price is optional. null/"" → "Sorulur".
  const priceVal = price === undefined || price === null || price === "" ? null : Number(price);
  if (Number(duration) < 5 || Number(duration) > 480) {
    return NextResponse.json({ error: "Süre 5–480 dk arasında olmalı" }, { status: 400 });
  }
  if (priceVal !== null && (!Number.isFinite(priceVal) || priceVal < 0 || priceVal > 100000)) {
    return NextResponse.json({ error: "Fiyat 0–100000 ₺ arasında olmalı" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      shopId,
      nameTr,
      nameEn:    nameEn    || nameTr,
      descTr:    descTr    || "",
      descEn:    descEn    || "",
      duration:  Number(duration),
      price:     priceVal,
      icon:      icon      || "✂️",
      category,
      popular:   popular   ?? false,
      active:    active    ?? true,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(service, { status: 201 });
});
