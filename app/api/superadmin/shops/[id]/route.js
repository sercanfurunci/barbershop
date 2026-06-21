import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

function gate(payload) {
  if (!payload) return unauthorized();
  if (payload.role !== "SUPER_ADMIN") return forbidden();
  return null;
}

// GET /api/superadmin/shops/[id]
export async function GET(request, { params }) {
  const payload = await requireAuth(request);
  const reject = gate(payload);
  if (reject) return reject;

  const { id } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      _count: { select: { barbers: true, services: true, appointments: true, users: true } },
      users: {
        where: { role: "ADMIN" },
        select: { id: true, email: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!shop) return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
  return NextResponse.json(shop);
}

// PATCH /api/superadmin/shops/[id]
// Body may include: name, address, phone, email, description, status ("ACTIVE" | "SUSPENDED")
export async function PATCH(request, { params }) {
  const payload = await requireAuth(request);
  const reject = gate(payload);
  if (reject) return reject;

  const { id } = await params;
  const body = await request.json();
  const data = {};

  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.slug !== undefined) data.slug = String(body.slug).trim().toLowerCase();
  if (body.address !== undefined) data.address = body.address || null;
  if (body.phone !== undefined) data.phone = body.phone || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.status !== undefined) {
    if (body.status !== "ACTIVE" && body.status !== "SUSPENDED") {
      return NextResponse.json({ error: "Geçersiz status" }, { status: 400 });
    }
    data.status = body.status;
  }

  // Subscription fields — manual override for sales-led billing.
  if (body.subscriptionStatus !== undefined) {
    const valid = ["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"];
    if (!valid.includes(body.subscriptionStatus)) {
      return NextResponse.json({ error: "Geçersiz subscriptionStatus" }, { status: 400 });
    }
    data.subscriptionStatus = body.subscriptionStatus;
  }
  if (body.planTier !== undefined) {
    const valid = ["STARTER", "PRO", "ENTERPRISE"];
    if (!valid.includes(body.planTier)) {
      return NextResponse.json({ error: "Geçersiz planTier" }, { status: 400 });
    }
    data.planTier = body.planTier;
  }
  // startTrialDays: set trialEndsAt = now + N, flip to TRIAL. For shops that
  // never got a trial set (legacy backfill or pre-trial-default rows).
  if (body.startTrialDays !== undefined) {
    const n = Number(body.startTrialDays);
    if (!Number.isFinite(n) || n <= 0 || n > 365) {
      return NextResponse.json({ error: "startTrialDays 1-365 olmalı" }, { status: 400 });
    }
    data.trialEndsAt = new Date(Date.now() + n * 86_400_000);
    if (data.subscriptionStatus === undefined) data.subscriptionStatus = "TRIAL";
  }
  // extendDays: add N days to currentPeriodEndsAt (or now if null/past).
  // Also flips to ACTIVE if not already, since we just got paid.
  if (body.extendDays !== undefined) {
    const n = Number(body.extendDays);
    if (!Number.isFinite(n) || n <= 0 || n > 3650) {
      return NextResponse.json({ error: "extendDays 1-3650 olmalı" }, { status: 400 });
    }
    const current = await prisma.shop.findUnique({
      where: { id }, select: { currentPeriodEndsAt: true },
    });
    if (!current) return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
    const base = current.currentPeriodEndsAt && current.currentPeriodEndsAt > new Date()
      ? current.currentPeriodEndsAt
      : new Date();
    data.currentPeriodEndsAt = new Date(base.getTime() + n * 86_400_000);
    if (data.subscriptionStatus === undefined) data.subscriptionStatus = "ACTIVE";
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  try {
    const shop = await prisma.shop.update({ where: { id }, data });
    return NextResponse.json(shop);
  } catch (e) {
    if (e.code === "P2025") return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
    throw e;
  }
}

// DELETE /api/superadmin/shops/[id]
// Cascade removes barbers, services, appointments, holidays, users (via schema onDelete: Cascade).
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  const reject = gate(payload);
  if (reject) return reject;

  const { id } = await params;
  try {
    await prisma.shop.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e.code === "P2025") return NextResponse.json({ error: "Salon bulunamadı" }, { status: 404 });
    throw e;
  }
}
