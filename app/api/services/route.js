import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultShopId } from "@/lib/shop";

export const revalidate = 300; // 5-minute cache

export async function GET() {
  const shopId = await getDefaultShopId();
  const services = await prisma.service.findMany({
    where: { shopId, active: true },
    orderBy: [{ category: "asc" }, { price: "asc" }],
  });
  const res = NextResponse.json(services);
  res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=60");
  return res;
}
