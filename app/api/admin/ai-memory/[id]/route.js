import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest, notFound } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

const PATCHABLE = [
  "favoriteBarber", "favoriteService", "preferredDays", "preferredTimes",
  "language", "hairNotes", "allergies", "communication", "expiresAt",
];

// PATCH /api/admin/ai-memory/:id
export const PATCH = withRole(ROLES, async (request, ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const { id } = await ctx.params;

  const body = await request.json().catch(() => ({}));
  const data = {};
  for (const k of PATCHABLE) if (body[k] !== undefined) data[k] = body[k];

  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt);

  try {
    const existing = await prisma.customerMemory.findFirst({ where: { id, shopId: sid }, select: { id: true } });
    if (!existing) return notFound("Kayıt bulunamadı");
    const updated = await prisma.customerMemory.update({
      where: { id },
      data: { ...data, lastUpdatedBy: "AGENT" },
    });
    return ok(updated);
  } catch (e) {
    return err(e.message, 500);
  }
});

// DELETE /api/admin/ai-memory/:id
export const DELETE = withRole(ROLES, async (request, ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const { id } = await ctx.params;

  try {
    const existing = await prisma.customerMemory.findFirst({ where: { id, shopId: sid }, select: { id: true } });
    if (!existing) return notFound("Kayıt bulunamadı");
    await prisma.customerMemory.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return err(e.message, 500);
  }
});
