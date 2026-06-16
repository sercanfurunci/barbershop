import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/clients?search=&barberId=&limit=200&offset=0
export async function GET(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN" &&
      payload.role !== "RECEPTIONIST" && payload.role !== "BARBER") return forbidden();

  const { searchParams } = new URL(request.url);
  const search   = searchParams.get("search") ?? "";
  const barberId = searchParams.get("barberId");
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);
  const offset   = parseInt(searchParams.get("offset") ?? "0");

  const shopId = payload.role === "SUPER_ADMIN"
    ? searchParams.get("shopId")
    : payload.shopId;

  if (!shopId) return NextResponse.json({ clients: [], total: 0 });

  const where = {
    shopId,
    ...(search && {
      OR: [
        { name:  { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    }),
    // If filtered by barber, only return clients who have an appointment with that barber
    ...(barberId && {
      appointments: { some: { barberId } },
    }),
  };

  const [rawClients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        appointments: {
          where:   { status: { notIn: ["CANCELLED"] } },
          select:  { date: true, price: true, status: true, barberId: true },
          orderBy: { date: "desc" },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  const clients = rawClients.map(c => {
    const appts     = c.appointments;
    const completed = appts.filter(a => a.status === "COMPLETED");
    const lastVisit = completed[0]?.date ?? appts[0]?.date ?? null;
    return {
      id:          c.id,
      name:        c.name,
      phone:       c.phone,
      email:       c.email,
      blocked:     c.blocked,
      noShows:     c.noShowCount,
      visits:      appts.length,
      totalSpent:  completed.reduce((s, a) => s + (a.price ?? 0), 0),
      lastVisit,
    };
  });

  return NextResponse.json({ clients, total });
}
