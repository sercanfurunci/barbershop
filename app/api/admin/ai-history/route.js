import { withRole } from "@/lib/middleware/withRole";
import { ok, err, badRequest } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

function shopId(payload, request) {
  return payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
}

// GET /api/admin/ai-history — list last 20 PromptVersion snapshots
export const GET = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");
  try {
    const versions = await prisma.promptVersion.findMany({
      where: { shopId: sid },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, version: true, changeNote: true,
        source: true, createdBy: true, createdAt: true,
        snapshot: false, // don't return full text in list
      },
    });
    return ok(versions);
  } catch (e) {
    return err(e.message, 500);
  }
});

// POST /api/admin/ai-history — manually save a snapshot
// Body: { snapshot, changeNote?, source? }
export const POST = withRole(ROLES, async (request, _ctx, payload) => {
  const sid = shopId(payload, request);
  if (!sid) return badRequest("shopId gerekli");

  const body = await request.json().catch(() => ({}));
  if (!body.snapshot?.trim()) return badRequest("snapshot gerekli");

  try {
    const last = await prisma.promptVersion.findFirst({
      where: { shopId: sid },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (last?.version ?? 0) + 1;

    const created = await prisma.promptVersion.create({
      data: {
        shopId:     sid,
        version:    nextVersion,
        snapshot:   String(body.snapshot),
        changeNote: body.changeNote ? String(body.changeNote) : null,
        source:     ["SETTINGS", "RULES", "KNOWLEDGE", "MANUAL"].includes(body.source) ? body.source : "MANUAL",
        createdBy:  payload.userId ?? payload.id ?? null,
      },
      select: { id: true, version: true, changeNote: true, source: true, createdBy: true, createdAt: true },
    });
    return ok(created, 201);
  } catch (e) {
    return err(e.message, 500);
  }
});
