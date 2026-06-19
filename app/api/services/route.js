import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  try {
    const services = await prisma.service.findMany({
      where: { shopId, active: true },
      orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { price: "asc" }],
    });
    const res = NextResponse.json(services);
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return res;
  } catch (err) {
    console.error("[GET /api/services]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
