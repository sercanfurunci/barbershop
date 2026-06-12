import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

// GET /api/superadmin/stats
// Platform-wide KPIs across every shop.
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "SUPER_ADMIN") return forbidden();

  const now = new Date();
  const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    totalShops,
    activeShops,
    suspendedShops,
    totalBarbers,
    totalUsers,
    totalAppointments,
    monthlyAppointments,
    revenueAgg,
    monthlyRevenueAgg,
  ] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { status: "ACTIVE" } }),
    prisma.shop.count({ where: { status: "SUSPENDED" } }),
    prisma.barber.count(),
    prisma.user.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { date: { gte: startOfMonth } } }),
    prisma.appointment.aggregate({
      _sum: { price: true },
      where: { status: "COMPLETED" },
    }),
    prisma.appointment.aggregate({
      _sum: { price: true },
      where: { status: "COMPLETED", date: { gte: startOfMonth } },
    }),
  ]);

  return NextResponse.json({
    totalShops,
    activeShops,
    suspendedShops,
    totalBarbers,
    totalUsers,
    totalAppointments,
    monthlyAppointments,
    totalRevenue: revenueAgg._sum.price ?? 0,
    monthlyRevenue: monthlyRevenueAgg._sum.price ?? 0,
  });
}
