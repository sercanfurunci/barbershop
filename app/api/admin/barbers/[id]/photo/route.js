import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/admin/barbers/:id/photo
// Body: { photo: "data:image/jpeg;base64,..." }
export async function POST(request, { params }) {
  try {
    const payload = await requireAuth(request);
    if (!payload) return unauthorized();
    if (!["ADMIN", "SUPER_ADMIN"].includes(payload.role)) return forbidden();

    const { id } = await params;

    let photo;
    try {
      ({ photo } = await request.json());
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
    }

    if (!photo || typeof photo !== "string") {
      return NextResponse.json({ error: "Fotoğraf gerekli" }, { status: 400 });
    }
    if (!photo.startsWith("data:image/")) {
      return NextResponse.json({ error: "Geçersiz format" }, { status: 400 });
    }
    if (photo.length > 2_800_000) {
      return NextResponse.json({ error: "Fotoğraf çok büyük (max 2 MB)" }, { status: 400 });
    }

    const barber = await prisma.barber.findUnique({ where: { id } });
    if (!barber) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });
    if (payload.role !== "SUPER_ADMIN" && barber.shopId !== payload.shopId) return forbidden();

    const updated = await prisma.barber.update({
      where: { id },
      data: { profilePhoto: photo },
    });

    return NextResponse.json({ profilePhoto: updated.profilePhoto });
  } catch (err) {
    console.error("[POST /api/admin/barbers/photo]", err);
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE /api/admin/barbers/:id/photo
export async function DELETE(request, { params }) {
  try {
    const payload = await requireAuth(request);
    if (!payload) return unauthorized();
    if (!["ADMIN", "SUPER_ADMIN"].includes(payload.role)) return forbidden();

    const { id } = await params;
    const barber = await prisma.barber.findUnique({ where: { id } });
    if (!barber) return NextResponse.json({ error: "Berber bulunamadı" }, { status: 404 });
    if (payload.role !== "SUPER_ADMIN" && barber.shopId !== payload.shopId) return forbidden();

    await prisma.barber.update({ where: { id }, data: { profilePhoto: null } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/admin/barbers/photo]", err);
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}
