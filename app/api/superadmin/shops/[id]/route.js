import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

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
