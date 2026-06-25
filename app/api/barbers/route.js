import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Returns all barbers (active + inactive). Public team display shows inactive
// ones with an "İzinli" badge; booking flows filter by `available` client-side
// so inactive barbers stay visible but aren't bookable.
export async function GET(request) {
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  try {
    const barbers = await prisma.barber.findMany({
      where: { shopId },
      include: { workingHours: true, breaks: true },
      orderBy: { createdAt: "asc" },
    });
    const res = NextResponse.json(barbers);
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return res;
  } catch (err) {
    console.error("[GET /api/barbers]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
