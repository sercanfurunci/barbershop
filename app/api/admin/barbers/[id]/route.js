import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

async function resolveBarber(id, payload) {
  const where = payload.role === "SUPER_ADMIN"
    ? { id }
    : { id, shopId: payload.shopId };

  const barber = await prisma.barber.findFirst({ where });
  if (!barber) return { err: NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 }) };
  return { barber };
}

// GET /api/admin/barbers/[id]
export const GET = withRole(ADMIN_ROLES, async (request, { params }, payload) => {
  const { id } = await params;
  const { err, barber } = await resolveBarber(id, payload);
  if (err) return err;

  const full = await prisma.barber.findUnique({
    where: { id: barber.id },
    include: { workingHours: true, breaks: true },
  });
  return NextResponse.json(full);
});

// PATCH /api/admin/barbers/[id]
// Accepts any subset of: nameTr, nameEn, titleTr, titleEn, bioTr, bioEn,
//                        avatar, color, yearsExp, specialties, available
export const PATCH = withRole(ADMIN_ROLES, async (request, { params }, payload) => {
  const { id } = await params;
  const { err, barber } = await resolveBarber(id, payload);
  if (err) return err;

  const body = await request.json();
  const allowed = ["nameTr","nameEn","titleTr","titleEn","bioTr","bioEn",
                   "avatar","color","yearsExp","specialties","available","slug",
                   "paymentType","commissionRate","fixedSalary"];
  const data = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  // Commission validation. We coerce empty strings to a sensible value rather
  // than null so the NOT NULL columns stay valid.
  if (data.paymentType !== undefined && data.paymentType !== "PERCENTAGE" && data.paymentType !== "FIXED") {
    return NextResponse.json({ error: "Geçersiz ödeme tipi" }, { status: 400 });
  }
  if (data.commissionRate !== undefined) {
    const cr = Number(data.commissionRate);
    if (!Number.isFinite(cr) || cr < 0 || cr > 100) {
      return NextResponse.json({ error: "Komisyon oranı 0-100 arasında olmalı" }, { status: 400 });
    }
    data.commissionRate = cr;
  }
  if (data.fixedSalary !== undefined) {
    if (data.fixedSalary === null || data.fixedSalary === "") {
      data.fixedSalary = null;
    } else {
      const fs = Number(data.fixedSalary);
      if (!Number.isFinite(fs) || fs < 0 || fs > 10_000_000) {
        return NextResponse.json({ error: "Maaş 0-10.000.000 arasında olmalı" }, { status: 400 });
      }
      data.fixedSalary = fs;
    }
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
});

// DELETE /api/admin/barbers/[id]
export const DELETE = withRole(ADMIN_ROLES, async (request, { params }, payload) => {
  const { id } = await params;
  const { err, barber } = await resolveBarber(id, payload);
  if (err) return err;

  // Defense-in-depth: scope by shopId in case resolveBarber gets bypassed later.
  const { count } = await prisma.barber.deleteMany({ where: { id: barber.id, shopId: barber.shopId } });
  if (!count) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true });
});
