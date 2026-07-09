import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { canCreateBarber } from "@/lib/subscription";
import bcrypt from "bcryptjs";

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

  const shopId = g.shopId ?? new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });
  const where = { shopId };
  const barbers = await prisma.barber.findMany({
    where,
    include: { workingHours: true, breaks: true },
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
  const { slug, nameTr, nameEn, titleTr, titleEn, bioTr, bioEn, avatar, yearsExp, specialties, color, password, email,
          paymentType, commissionRate, fixedSalary } = body;

  if (!slug || !nameTr || !titleTr || !avatar) {
    return NextResponse.json({ error: "slug, nameTr, titleTr ve avatar zorunlu" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi gerekli" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalı" }, { status: 400 });
  }
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    return NextResponse.json({ error: "Slug sadece küçük harf, rakam ve tire içerebilir (2-40 karakter)" }, { status: 400 });
  }

  const dupe = await prisma.barber.findFirst({ where: { shopId, slug } });
  if (dupe) return NextResponse.json({ error: "Bu slug zaten kullanılıyor" }, { status: 409 });

  // Plan limit gate. 402 Payment Required is the conventional status for
  // "this is a billing limit, not a permission issue".
  const limit = await canCreateBarber(shopId);
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.reason, limit: limit.limit, current: limit.current },
      { status: 402 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userDupe = await prisma.user.findFirst({ where: { email: normalizedEmail } });
  if (userDupe) return NextResponse.json({ error: "Bu e-posta adresi zaten kullanılıyor" }, { status: 409 });

  // Commission settings — default to shop's defaultCommissionRate when admin
  // leaves the field blank, so a freshly-created barber inherits the house split.
  const pt = paymentType === "FIXED" ? "FIXED" : "PERCENTAGE";
  let cr;
  if (pt === "PERCENTAGE") {
    if (commissionRate == null || commissionRate === "") {
      const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { defaultCommissionRate: true } });
      cr = shop?.defaultCommissionRate ?? 50;
    } else {
      cr = Number(commissionRate);
      if (!Number.isFinite(cr) || cr < 0 || cr > 100) {
        return NextResponse.json({ error: "Komisyon oranı 0-100 arasında olmalı" }, { status: 400 });
      }
    }
  } else {
    cr = 0;
  }
  let fs = null;
  if (pt === "FIXED") {
    fs = fixedSalary == null || fixedSalary === "" ? null : Number(fixedSalary);
    if (fs != null && (!Number.isFinite(fs) || fs < 0 || fs > 10_000_000)) {
      return NextResponse.json({ error: "Maaş 0-10.000.000 arasında olmalı" }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Create barber + user account in one transaction
  const [barber] = await prisma.$transaction(async (tx) => {
    const b = await tx.barber.create({
      data: {
        shopId,
        slug,
        nameTr,
        nameEn:      nameEn      || nameTr,
        titleTr,
        titleEn:     titleEn     || titleTr,
        bioTr:       bioTr       || "",
        bioEn:       bioEn       || "",
        avatar,
        yearsExp:    yearsExp    ?? 1,
        specialties: specialties ?? [],
        color:       color       || "#111111",
        paymentType: pt,
        commissionRate: cr,
        fixedSalary: fs,
      },
      include: { workingHours: true },
    });

    await tx.user.create({
      data: {
        email: normalizedEmail,
        displayName: nameTr,
        passwordHash,
        role:        "BARBER",
        shopId,
        barberId:    b.id,
      },
    });

    return [b];
  });

  return NextResponse.json(barber, { status: 201 });
}
