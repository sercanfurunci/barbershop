import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "RECEPTIONIST", "BARBER"];

// GET /api/admin/clients/[id] — full client profile with appointment timeline
export const GET = withRole(ADMIN_ROLES, async (request, { params }, payload) => {
  const { id } = await params;
  const shopId = payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;

  if (!shopId) return ok({ client: null });

  const client = await prisma.client.findFirst({
    where: { id, shopId },
    select: {
      id: true, name: true, phone: true, email: true, notes: true,
      blocked: true, noShowCount: true, totalSpent: true,
      visitCount: true, lastVisitAt: true, createdAt: true,
      appointments: {
        orderBy: { date: "desc" },
        take: 50,
        select: {
          id: true, date: true, time: true, status: true, price: true,
          duration: true, bookedByName: true, cancellationReason: true,
          completedAt: true, cancelledAt: true,
          barber:  { select: { nameTr: true } },
          service: { select: { nameTr: true } },
        },
      },
    },
  });

  return ok({ client });
});
