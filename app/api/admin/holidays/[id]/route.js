import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

// DELETE /api/admin/holidays/[id]
export async function DELETE(request, { params }) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "RECEPTIONIST") return forbidden();

  const { id } = await params;
  await prisma.holiday.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
