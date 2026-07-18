import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest, notFound } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/ai-history/:id — full snapshot
export const GET = withRole(ROLES, async (request, ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const { id } = await ctx.params;

  const row = await prisma.promptVersion.findFirst({
    where: { id, shopId: sid },
  });
  if (!row) return notFound("Kayıt bulunamadı");
  return ok(row);
});

// DELETE /api/admin/ai-history/:id
export const DELETE = withRole(ROLES, async (request, ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  const { id } = await ctx.params;

  try {
    const existing = await prisma.promptVersion.findFirst({ where: { id, shopId: sid }, select: { id: true } });
    if (!existing) return notFound("Kayıt bulunamadı");
    await prisma.promptVersion.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return err(e.message, 500);
  }
});
