import { prisma } from "@/lib/prisma";
import { canCreateBarber } from "@/lib/subscription";
import bcrypt from "bcryptjs";
import { ok, created, badRequest, conflict } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

function resolveShopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/barbers
export const GET = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = resolveShopId(payload, request);
  if (!shopId) return badRequest("shopId gerekli");

  const barbers = await prisma.barber.findMany({
    where: { shopId },
    include: { workingHours: true, breaks: true },
    orderBy: { createdAt: "asc" },
  });

  return ok(barbers);
});

// POST /api/admin/barbers
// body: { slug, nameTr, nameEn?, titleTr, titleEn?, bioTr?, bioEn?, avatar, yearsExp?, specialties?, color? }
export const POST = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
  if (!shopId) return badRequest("shopId gerekli");

  const body = await request.json();
  const { slug, nameTr, nameEn, titleTr, titleEn, bioTr, bioEn, avatar, yearsExp, specialties, color, password, email,
          paymentType, commissionRate, fixedSalary } = body;

  if (!slug || !nameTr || !titleTr || !avatar) {
    return badRequest("slug, nameTr, titleTr ve avatar zorunlu");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("Geçerli bir e-posta adresi gerekli");
  }
  if (!password || password.length < 8) {
    return badRequest("Şifre en az 8 karakter olmalı");
  }
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
    return badRequest("Slug sadece küçük harf, rakam ve tire içerebilir (2-40 karakter)");
  }

  const dupe = await prisma.barber.findFirst({ where: { shopId, slug } });
  if (dupe) return conflict("Bu slug zaten kullanılıyor");

  // Plan limit gate. 402 Payment Required is the conventional status for
  // "this is a billing limit, not a permission issue".
  const limit = await canCreateBarber(shopId);
  if (!limit.ok) {
    return ok({ error: limit.reason, limit: limit.limit, current: limit.current }, 402);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userDupe = await prisma.user.findFirst({ where: { email: normalizedEmail } });
  if (userDupe) return conflict("Bu e-posta adresi zaten kullanılıyor");

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
        return badRequest("Komisyon oranı 0-100 arasında olmalı");
      }
    }
  } else {
    cr = 0;
  }
  let fs = null;
  if (pt === "FIXED") {
    fs = fixedSalary == null || fixedSalary === "" ? null : Number(fixedSalary);
    if (fs != null && (!Number.isFinite(fs) || fs < 0 || fs > 10_000_000)) {
      return badRequest("Maaş 0-10.000.000 arasında olmalı");
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create barber + user account in one transaction
  let barber;
  try {
  [barber] = await prisma.$transaction(async (tx) => {
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
  } catch (e) {
    if (e.code === "P2002") {
      return conflict("Bu slug veya e-posta zaten kullanılıyor");
    }
    throw e;
  }

  return created(barber);
});
