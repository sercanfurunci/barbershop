import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import bcrypt from "bcryptjs";

function gate(payload) {
  if (!payload) return unauthorized();
  if (payload.role !== "SUPER_ADMIN") return forbidden();
  return null;
}

// Slug: lowercase letters, numbers, hyphens; must start with a letter.
const SLUG_RE = /^[a-z][a-z0-9-]{2,30}$/;

// GET /api/superadmin/shops
// Returns every shop with counts for at-a-glance health.
export async function GET(request) {
  const payload = await requireAuth(request);
  const reject = gate(payload);
  if (reject) return reject;

  const shops = await prisma.shop.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { barbers: true, services: true, appointments: true, users: true } },
    },
  });

  return NextResponse.json(shops);
}

// POST /api/superadmin/shops
// body: { slug, name, address?, phone?, email?, adminEmail, adminPassword }
// Creates the shop and an initial ADMIN user atomically.
export async function POST(request) {
  const payload = await requireAuth(request);
  const reject = gate(payload);
  if (reject) return reject;

  const body = await request.json();
  const { slug, name, address, phone, email, adminEmail, adminPassword } = body;

  if (!slug || !name || !adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "Slug, isim, admin email ve şifre zorunlu" },
      { status: 400 },
    );
  }
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "Slug 3-31 karakter, sadece küçük harf/rakam/tire — harfle başlamalı" },
      { status: 400 },
    );
  }
  if (adminPassword.length < 6) {
    return NextResponse.json({ error: "Admin şifresi en az 6 karakter" }, { status: 400 });
  }

  const existing = await prisma.shop.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Bu slug zaten kullanılıyor" }, { status: 409 });

  const dupeUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (dupeUser) return NextResponse.json({ error: "Bu admin email zaten kayıtlı" }, { status: 409 });

  const hash = await bcrypt.hash(adminPassword, 12);

  // Atomic: shop + admin user together, so a half-created shop never exists.
  const result = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        slug,
        name,
        address: address ?? null,
        phone:   phone ?? null,
        email:   email ?? null,
        status:  "ACTIVE",
      },
    });
    const admin = await tx.user.create({
      data: {
        email:        adminEmail,
        passwordHash: hash,
        role:         "ADMIN",
        shopId:       shop.id,
      },
      select: { id: true, email: true, role: true },
    });
    return { shop, admin };
  });

  return NextResponse.json(result, { status: 201 });
}
