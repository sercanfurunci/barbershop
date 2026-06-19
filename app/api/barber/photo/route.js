import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";
import { uploadBarberPhoto, deleteBarberPhoto } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

// POST — barber updates own profile photo
export async function POST(request) {
  try {
    const payload = await requireAuth(request);
    if (!payload) return unauthorized();
    if (!payload.barberId) return forbidden();

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
    }

    const { photo } = body;

    if (!photo || typeof photo !== "string") {
      return NextResponse.json({ error: "Fotoğraf gerekli" }, { status: 400 });
    }
    if (!photo.startsWith("data:image/")) {
      return NextResponse.json({ error: "Geçersiz format" }, { status: 400 });
    }
    if (photo.length > 2_800_000) {
      return NextResponse.json({ error: "Fotoğraf çok büyük (max 2 MB)" }, { status: 400 });
    }

    const url = await uploadBarberPhoto(photo, payload.barberId);
    await prisma.barber.update({
      where: { id: payload.barberId },
      data:  { profilePhoto: url },
    });

    return NextResponse.json({ profilePhoto: url });
  } catch (err) {
    console.error("[POST /api/barber/photo]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — remove own photo
export async function DELETE(request) {
  try {
    const payload = await requireAuth(request);
    if (!payload) return unauthorized();
    if (!payload.barberId) return forbidden();

    await deleteBarberPhoto(payload.barberId);
    await prisma.barber.update({
      where: { id: payload.barberId },
      data:  { profilePhoto: null },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/barber/photo]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
