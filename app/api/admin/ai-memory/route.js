import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/ai-memory?search=&page=1&limit=20
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page   = Math.max(1, Number(searchParams.get("page")  ?? 1));
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip   = (page - 1) * limit;

  const where = {
    shopId: sid,
    ...(search ? { senderPhone: { contains: search } } : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      prisma.customerMemory.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customerMemory.count({ where }),
    ]);

    // Enrich with favorite barber/service names when we have the ids
    const barberIds  = [...new Set(rows.map(r => r.favoriteBarber).filter(Boolean))];
    const serviceIds = [...new Set(rows.map(r => r.favoriteService).filter(Boolean))];
    const [barbers, services] = await Promise.all([
      barberIds.length ? prisma.barber.findMany({ where: { id: { in: barberIds } }, select: { id: true, nameTr: true } }) : [],
      serviceIds.length ? prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true, nameTr: true } }) : [],
    ]);
    const bm = new Map(barbers.map(b => [b.id, b.nameTr]));
    const sm = new Map(services.map(s => [s.id, s.nameTr]));

    const data = rows.map(r => ({
      ...r,
      favoriteBarberName:  r.favoriteBarber  ? (bm.get(r.favoriteBarber)  ?? null) : null,
      favoriteServiceName: r.favoriteService ? (sm.get(r.favoriteService) ?? null) : null,
    }));

    return ok({ data, total, page, limit });
  } catch (e) {
    return err(e.message, 500);
  }
});
