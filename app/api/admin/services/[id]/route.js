import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["CUTS", "BEARD", "COMBO", "PREMIUM"];

async function resolve(id, payload) {
  if (!payload) return { err: unauthorized() };
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") return { err: forbidden() };
  const where = payload.role === "SUPER_ADMIN" ? { id } : { id, shopId: payload.shopId };
  const service = await prisma.service.findFirst({ where });
  if (!service) return { err: NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 }) };
  return { service };
}

// GET /api/admin/services/[id]
export async function GET(request, { params }) {
  const payload = await requireAuth(request);
  const { id } = await params;
  const { err, service } = await resolve(id, payload);
  if (err) return err;
  return NextResponse.json(service);
}

// PATCH /api/admin/services/[id]
// Accepts any subset of: nameTr, nameEn, descTr, descEn, duration, price, icon, image, category, popular, active, sortOrder
export async function PATCH(request, { params }) {
  const payload = await requireAuth(request);
  const { id } = await params;
  const { err, service } = await resolve(id, payload);
  if (err) return err;

  const body = await request.json();
  const allowed = ["nameTr","nameEn","descTr","descEn","duration","price","icon","image","category","popular","active","sortOrder"];
  const data = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (data.duration !== undefined) {
    data.duration = Number(data.duration);
    if (data.duration < 5 || data.duration > 480) {
      return NextResponse.json({ error: "Süre 5–480 dk arasında olmalı" }, { status: 400 });
    }
  }
  if (data.price !== undefined) {
    // null / "" → leave blank ("Sorulur"). Number otherwise.
    if (data.price === null || data.price === "") {
      data.price = null;
    } else {
      data.price = Number(data.price);
      if (!Number.isFinite(data.price) || data.price < 0 || data.price > 100000) {
        return NextResponse.json({ error: "Fiyat 0–100000 ₺ arasında olmalı" }, { status: 400 });
      }
    }
  }
  if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder);
  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const updated = await prisma.service.update({ where: { id: service.id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/admin/services/[id]
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  const { id } = await params;
  const { err, service } = await resolve(id, payload);
  if (err) return err;

  // Defense-in-depth shopId scope.
  const { count } = await prisma.service.deleteMany({ where: { id: service.id, shopId: service.shopId } });
  if (!count) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
