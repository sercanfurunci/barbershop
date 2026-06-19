import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/staff?shopId=X
// Public — returns shop admins and barbers for the login picker UI.
// Only exposes display info, no sensitive fields.
export async function GET(request) {
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  const [admins, barbers] = await Promise.all([
    prisma.user.findMany({
      where: { shopId, role: { in: ["ADMIN", "RECEPTIONIST"] } },
      select: { id: true, displayName: true, username: true, email: true, role: true },
    }),
    prisma.barber.findMany({
      where: { shopId, available: true },
      select: { id: true, slug: true, nameTr: true, titleTr: true, avatar: true, available: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({ admins, barbers });
}
