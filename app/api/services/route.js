import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultShopId } from "@/lib/shop";

export const revalidate = 300;

export async function GET() {
  try {
    const shopId = await getDefaultShopId();
    const services = await prisma.service.findMany({
      where: { shopId, active: true },
      orderBy: [{ sortOrder: "asc" }, { category: "asc" }, { price: "asc" }],
    });
    const res = NextResponse.json(services);
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
    return res;
  } catch (err) {
    console.error("[GET /api/services]", err);
    return NextResponse.json({ error: "Sunucu hatası", detail: err.message }, { status: 500 });
  }
}
