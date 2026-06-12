import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

function guard(payload) {
  if (!payload) return { error: unauthorized() };
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") return { error: forbidden() };
  if (payload.role === "SUPER_ADMIN") return { shopId: null };
  if (!payload.shopId) return { error: forbidden() };
  return { shopId: payload.shopId };
}

// GET /api/admin/barbers
export async function GET(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const where = g.shopId ? { shopId: g.shopId } : {};
  const barbers = await prisma.barber.findMany({
    where,
    include: { workingHours: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(barbers);
}

// POST /api/admin/barbers
// body: { slug, nameTr, nameEn?, titleTr, titleEn?, bioTr?, bioEn?, avatar, yearsExp?, specialties?, color? }
export async function POST(request) {
  const payload = await requireAuth(request);
  const g = guard(payload);
  if (g.error) return g.error;

  const shopId = g.shopId;
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const body = await request.json();
  const { slug, nameTr, nameEn, titleTr, titleEn, bioTr, bioEn, avatar, yearsExp, specialties, color } = body;

  if (!slug || !nameTr || !titleTr || !avatar) {
    return NextResponse.json({ error: "slug, nameTr, titleTr ve avatar zorunlu" }, { status: 400 });
  }

  const dupe = await prisma.barber.findFirst({ where: { shopId, slug } });
  if (dupe) return NextResponse.json({ error: "Bu slug zaten kullanılıyor" }, { status: 409 });

  const barber = await prisma.barber.create({
    data: {
      shopId,
      slug,
      nameTr,
      nameEn:    nameEn    || nameTr,
      titleTr,
      titleEn:   titleEn   || titleTr,
      bioTr:     bioTr     || "",
      bioEn:     bioEn     || "",
      avatar,
      yearsExp:  yearsExp  ?? 1,
      specialties: specialties ?? [],
      color:     color     || "#CC1A1A",
    },
    include: { workingHours: true },
  });

  return NextResponse.json(barber, { status: 201 });
}
