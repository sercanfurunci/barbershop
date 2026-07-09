import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// DELETE /api/customer/favorites/:shopId — remove a favorite
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopId } = await params;

  await prisma.customerFavorite.deleteMany({
    where: { userId: payload.userId, shopId },
  });

  return NextResponse.json({ ok: true });
}
