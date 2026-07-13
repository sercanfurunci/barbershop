import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

// DELETE /api/admin/holidays/[id]
export const DELETE = withRole(["ADMIN", "RECEPTIONIST", "SUPER_ADMIN"], async (request, { params }, payload) => {

  const { id } = await params;

  // Shop-scope check: deleting a holiday from another shop is forbidden
  const holiday = await prisma.holiday.findUnique({ where: { id }, select: { shopId: true } });
  if (!holiday) return NextResponse.json({ error: "Tatil bulunamadı" }, { status: 404 });
  if (payload.role !== "SUPER_ADMIN" && holiday.shopId !== payload.shopId) return forbidden();

  await prisma.holiday.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
