import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

// DELETE /api/admin/holidays/[id]
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "RECEPTIONIST" && payload.role !== "SUPER_ADMIN") return forbidden();

  const { id } = await params;

  // Shop-scope check: deleting a holiday from another shop is forbidden
  const holiday = await prisma.holiday.findUnique({ where: { id }, select: { shopId: true } });
  if (!holiday) return NextResponse.json({ error: "Tatil bulunamadı" }, { status: 404 });
  if (payload.role !== "SUPER_ADMIN" && holiday.shopId !== payload.shopId) return forbidden();

  await prisma.holiday.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
