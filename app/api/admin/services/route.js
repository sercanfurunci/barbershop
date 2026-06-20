import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

const VALID_CATEGORIES = ["CUTS", "BEARD", "COMBO", "PREMIUM"];

function guard(payload) {
  if (!payload) return { error: unauthorized() };
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") return { error: forbidden() };
  if (payload.role === "SUPER_ADMIN") return { shopId: null };
  if (!payload.shopId) return { error: forbidden() };
  return { shopId: payload.shopId };
}

// GET /api/admin/services — all services for this shop (including inactive)
export async function GET(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.toLowerCase() ?? "";

  const shopId = g.shopId ?? searchParams.get("shopId");
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
}

// POST /api/admin/services
// body: { nameTr, nameEn?, descTr?, descEn?, duration, price, icon?, category, popular?, active?, sortOrder? }
export async function POST(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const shopId = g.shopId;
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const body = await request.json();
  const { nameTr, nameEn, descTr, descEn, duration, price, icon, category, popular, active, sortOrder } = body;

  if (!nameTr || !duration || price === undefined || !category) {
    return NextResponse.json({ error: "nameTr, duration, price ve category zorunlu" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Geçersiz kategori. Seçenekler: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
  }
  if (Number(duration) < 5 || Number(duration) > 480 || Number(price) < 0 || Number(price) > 100000) {
    return NextResponse.json({ error: "Süre 5–480 dk, fiyat 0–100000 ₺ arasında olmalı" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      shopId,
      nameTr,
      nameEn:    nameEn    || nameTr,
      descTr:    descTr    || "",
      descEn:    descEn    || "",
      duration:  Number(duration),
      price:     Number(price),
      icon:      icon      || "✂️",
      category,
      popular:   popular   ?? false,
      active:    active    ?? true,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
