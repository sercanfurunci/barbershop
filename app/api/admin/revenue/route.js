import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const STATS_ROLES = ["ADMIN", "SUPER_ADMIN", "RECEPTIONIST", "BARBER"];

// GET /api/admin/revenue?range=30d|7d&barberId=
// Returns daily completed appointment revenue for the given range
export const GET = withRole(STATS_ROLES, async (request, _ctx, payload) => {
  const { searchParams } = new URL(request.url);
  const range    = searchParams.get("range") ?? "30d";
  const barberId = searchParams.get("barberId") ?? null;

  const shopId = payload.role === "SUPER_ADMIN"
    ? searchParams.get("shopId")
    : payload.shopId;

  if (!shopId) return NextResponse.json({ data: [], total: 0, avg: 0 });

  const TZ = "Europe/Istanbul";
  const toDateStr = (d) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const getDayLabel = (dateStr) => {
    // Parse as local date to get day-of-week correctly
    const [y, m, day] = dateStr.split("-").map(Number);
    const dow = new Date(y, m - 1, day).getDay();
    return ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][dow === 0 ? 6 : dow - 1];
  };

  const days = range === "7d" ? 7 : 30;
  const todayStr = toDateStr(new Date());
  const [ty, tm, td] = todayStr.split("-").map(Number);

  // Build date range starting (days-1) days before today in Istanbul time
  const startDate = new Date(ty, tm - 1, td - (days - 1));
  const startStr = toDateStr(startDate);

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

  const map = Object.fromEntries(groups.map(g => [g.date, g._sum.price ?? 0]));

  const data = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(ty, tm - 1, td - (days - 1) + i);
    const key = toDateStr(d);
    const label = range === "7d"
      ? getDayLabel(key)
      : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    data.push({ date: label, fullDate: key, value: map[key] ?? 0 });
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const nonZero = data.filter(d => d.value > 0).length;
  const avg = nonZero > 0 ? Math.round(total / nonZero) : 0;

  return NextResponse.json({ data, total, avg });
});
