import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultShopId } from "@/lib/shop";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const shopId = await getDefaultShopId();
    const barbers = await prisma.barber.findMany({
      where: { shopId, available: true },
      include: { workingHours: true, breaks: true },
      orderBy: { createdAt: "asc" },
    });
    const res = NextResponse.json(barbers);
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return res;
  } catch (err) {
    console.error("[GET /api/barbers]", err);
    return NextResponse.json({ error: "Sunucu hatası", detail: err.message }, { status: 500 });
  }
}
