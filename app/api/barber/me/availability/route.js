import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST — barber toggles own availability (Müsait / Müsait Değil)
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!payload.barberId) return forbidden();

  let body;
  try { body = await request.json(); } catch { body = {}; }
  if (typeof body.available !== "boolean") {
    return NextResponse.json({ error: "available boolean gerekli" }, { status: 400 });
  }

  const updated = await prisma.barber.update({
    where: { id: payload.barberId },
    data:  { available: body.available },
    select: { id: true, available: true },
  });
  return NextResponse.json(updated);
}
