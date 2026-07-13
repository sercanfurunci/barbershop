import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "RECEPTIONIST", "BARBER"];

// GET /api/admin/clients?search=&barberId=&limit=200&offset=0
export const GET = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const { searchParams } = new URL(request.url);
  const search   = searchParams.get("search") ?? "";
  const barberId = searchParams.get("barberId");
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);
  const offset   = parseInt(searchParams.get("offset") ?? "0");

  const shopId = payload.role === "SUPER_ADMIN"
    ? searchParams.get("shopId")
    : payload.shopId;

  if (!shopId) return ok({ clients: [], total: 0 });

  const barberFilter = barberId
    ? barberId
    : payload.role === "BARBER" ? payload.barberId : null;

  const where = {
    shopId,
    ...(search && {
      OR: [
        { name:  { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ],
    }),
    ...(barberFilter && {
      appointments: { some: { barberId: barberFilter } },
    }),
  };

  const [rawClients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      select: {
        id: true, name: true, phone: true, email: true,
        blocked: true, noShowCount: true,
        totalSpent: true, visitCount: true, lastVisitAt: true,
      },
    }),
    prisma.client.count({ where }),
  ]);

  const clients = rawClients.map(c => ({
    id:         c.id,
    name:       c.name,
    phone:      c.phone,
    email:      c.email,
    blocked:    c.blocked,
    noShows:    c.noShowCount,
    visits:     c.visitCount,
    totalSpent: c.totalSpent,
    lastVisit:  c.lastVisitAt ? c.lastVisitAt.toISOString().slice(0, 10) : null,
  }));

  return ok({ clients, total });
});
