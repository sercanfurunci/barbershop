import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/revenue?range=30d|7d&barberId=
// Returns daily completed appointment revenue for the given range
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!["ADMIN", "SUPER_ADMIN", "RECEPTIONIST", "BARBER"].includes(payload.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const range    = searchParams.get("range") ?? "30d";
  const barberId = searchParams.get("barberId") ?? null;

  const shopId = payload.role === "SUPER_ADMIN"
    ? searchParams.get("shopId")
    : payload.shopId;

  if (!shopId) return NextResponse.json({ data: [], total: 0, avg: 0 });

  const days = range === "7d" ? 7 : 30;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;

  const groups = await prisma.appointment.groupBy({
    by: ["date"],
    where: {
      shopId,
      status: "COMPLETED",
      date: { gte: startStr },
      ...(barberId ? { barberId } : {}),
    },
    _sum: { price: true },
    orderBy: { date: "asc" },
  });

  // Fill in all days (including zero-revenue days)
  const map = Object.fromEntries(groups.map(g => [g.date, g._sum.price ?? 0]));

  const data = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = range === "7d"
      ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][d.getDay() === 0 ? 6 : d.getDay() - 1]
      : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    data.push({ date: label, fullDate: key, value: map[key] ?? 0 });
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const nonZero = data.filter(d => d.value > 0).length;
  const avg = nonZero > 0 ? Math.round(total / nonZero) : 0;

  return NextResponse.json({ data, total, avg });
}
