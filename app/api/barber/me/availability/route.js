import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const BARBER_ROLES = ["BARBER", "ADMIN", "SUPER_ADMIN"];

// POST — barber toggles own availability (Müsait / Müsait Değil)
export const POST = withRole(BARBER_ROLES, async (request, _ctx, payload) => {
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
});
