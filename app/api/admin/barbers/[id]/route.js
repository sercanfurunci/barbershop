import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

async function resolveBarber(id, payload) {
  if (!payload) return { err: unauthorized() };
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") return { err: forbidden() };

  const where = payload.role === "SUPER_ADMIN"
    ? { id }
    : { id, shopId: payload.shopId };

  const barber = await prisma.barber.findFirst({ where });
  if (!barber) return { err: NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 }) };
  return { barber };
}

// GET /api/admin/barbers/[id]
export async function GET(request, { params }) {
  const payload = await requireAuth(request);
  const { id } = await params;
  const { err, barber } = await resolveBarber(id, payload);
  if (err) return err;

  const full = await prisma.barber.findUnique({
    where: { id: barber.id },
    include: { workingHours: true, breaks: true },
  });
  return NextResponse.json(full);
}

// PATCH /api/admin/barbers/[id]
// Accepts any subset of: nameTr, nameEn, titleTr, titleEn, bioTr, bioEn,
//                        avatar, color, yearsExp, specialties, available
export async function PATCH(request, { params }) {
  const payload = await requireAuth(request);
  const { id } = await params;
  const { err, barber } = await resolveBarber(id, payload);
  if (err) return err;

  const body = await request.json();
  const allowed = ["nameTr","nameEn","titleTr","titleEn","bioTr","bioEn",
                   "avatar","color","yearsExp","specialties","available","slug"];
  const data = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  // slug uniqueness check within shop if slug is changing
  if (data.slug && data.slug !== barber.slug) {
    const dupe = await prisma.barber.findFirst({
      where: { shopId: barber.shopId, slug: data.slug, NOT: { id: barber.id } },
    });
    if (dupe) return NextResponse.json({ error: "Bu slug zaten kullanılıyor" }, { status: 409 });
  }

  const updated = await prisma.barber.update({
    where: { id: barber.id },
    data,
    include: { workingHours: true },
  });
  return NextResponse.json(updated);
}

// DELETE /api/admin/barbers/[id]
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  const { id } = await params;
  const { err } = await resolveBarber(id, payload);
  if (err) return err;

  await prisma.barber.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
