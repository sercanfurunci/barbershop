import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

// DELETE /api/customer/barber-favorites/[barberId]
export const DELETE = withAuth(async (request, { params }, payload) => {

  const { barberId } = await params;

  await prisma.barberFavorite.deleteMany({
    where: { userId: payload.userId, barberId },
  });

  return NextResponse.json({ ok: true });
});
