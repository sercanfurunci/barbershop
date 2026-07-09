import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/customer/barber-favorites/[barberId]
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { barberId } = await params;

  await prisma.barberFavorite.deleteMany({
    where: { userId: payload.userId, barberId },
  });

  return NextResponse.json({ ok: true });
}
