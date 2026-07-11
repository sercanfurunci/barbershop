import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_PHOTOS   = 4;
const MAX_BYTES    = 8 * 1024 * 1024; // 8 MB per image
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

function canAccess(payload, appt) {
  if (payload.role === "SUPER_ADMIN") return true;
  if (payload.role === "ADMIN" && payload.shopId === appt.shopId) return true;
  if (payload.role === "BARBER" && payload.shopId === appt.shopId) return true;
  return false;
}

// POST /api/appointments/[id]/photos
// Accepts multipart/form-data with field "photo" (image file).
// Uploads to Cloudinary if configured, otherwise stores data URL (dev only).
// Returns updated photoUrls array.
export async function POST(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const { id } = await params;

  const appt = await prisma.appointment.findFirst({
    where: { id },
    select: { id: true, shopId: true, photoUrls: true },
  });
  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (!canAccess(payload, appt)) return forbidden();

  if (appt.photoUrls.length >= MAX_PHOTOS)
    return NextResponse.json({ error: `En fazla ${MAX_PHOTOS} fotoğraf yüklenebilir` }, { status: 400 });

  let photoUrl;

  if (process.env.CLOUDINARY_URL) {
    // Cloudinary upload
    const form = await request.formData();
    const file = form.get("photo");
    if (!file || typeof file === "string")
      return NextResponse.json({ error: "Fotoğraf gerekli" }, { status: 400 });
    if (!ALLOWED_MIME.has(file.type))
      return NextResponse.json({ error: "Sadece JPEG, PNG, WebP veya HEIC yüklenebilir" }, { status: 400 });

    const buf  = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES)
      return NextResponse.json({ error: "Fotoğraf çok büyük (max 8MB)" }, { status: 400 });

    const b64  = `data:${file.type};base64,${buf.toString("base64")}`;
    const cdUrl = process.env.CLOUDINARY_URL.replace("cloudinary://", "");
    const [apiKey, rest] = cdUrl.split(":");
    const [secret, cloudName] = rest.split("@");

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: b64,
          upload_preset: "appointment_photos",
          folder: `appointments/${appt.shopId}`,
          api_key: apiKey,
        }),
      }
    );
    if (!uploadRes.ok) return NextResponse.json({ error: "Yükleme başarısız" }, { status: 500 });
    const cdn = await uploadRes.json();
    photoUrl = cdn.secure_url;
  } else {
    // Dev fallback — store as data URL (not suitable for production)
    const form = await request.formData();
    const file = form.get("photo");
    if (!file || typeof file === "string")
      return NextResponse.json({ error: "Fotoğraf gerekli" }, { status: 400 });
    if (!ALLOWED_MIME.has(file.type))
      return NextResponse.json({ error: "Sadece JPEG, PNG, WebP veya HEIC yüklenebilir" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES)
      return NextResponse.json({ error: "Fotoğraf çok büyük (max 8MB)" }, { status: 400 });
    photoUrl = `data:${file.type};base64,${buf.toString("base64")}`;
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { photoUrls: { push: photoUrl } },
    select: { photoUrls: true },
  });

  return NextResponse.json({ photoUrls: updated.photoUrls }, { status: 201 });
}

// DELETE /api/appointments/[id]/photos?url=...
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();

  const { id } = await params;
  const photoUrl = new URL(request.url).searchParams.get("url");
  if (!photoUrl) return NextResponse.json({ error: "url gerekli" }, { status: 400 });

  const appt = await prisma.appointment.findFirst({ where: { id }, select: { shopId: true, photoUrls: true } });
  if (!appt) return NextResponse.json({ error: "Randevu bulunamadı" }, { status: 404 });
  if (!canAccess(payload, appt)) return forbidden();

  await prisma.appointment.update({
    where: { id },
    data: { photoUrls: appt.photoUrls.filter((u) => u !== photoUrl) },
  });

  return NextResponse.json({ ok: true });
}
