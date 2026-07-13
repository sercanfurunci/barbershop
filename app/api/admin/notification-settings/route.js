import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden } from "@/lib/apiResponse";
import { withRole } from "@/lib/middleware/withRole";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "RECEPTIONIST"];

function resolveShopId(payload, request) {
  if (payload.role === "SUPER_ADMIN") return null; // will be passed via ?shopId or body
  return payload.shopId;
}

export const GET = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const shopId = payload.role === "SUPER_ADMIN"
    ? new URL(request.url).searchParams.get("shopId")
    : payload.shopId;
  if (!shopId) return NextResponse.json({}, { status: 400 });

  const settings = await prisma.notificationSettings.findUnique({ where: { shopId } });
  if (!settings) return NextResponse.json({});
  // Redact stored credential — client only needs to know "is it set?"
  const { netgsmPassword, ...rest } = settings;
  return NextResponse.json({ ...rest, netgsmPasswordSet: !!netgsmPassword });
});

export const PATCH = withRole(ADMIN_ROLES, async (request, _ctx, payload) => {
  const body   = await request.json();
  const shopId = payload.role === "SUPER_ADMIN"
    ? body.shopId
    : payload.shopId;
  if (!shopId) return NextResponse.json({ error: "shopId gerekli" }, { status: 400 });

  // Allowed fields
  const ALLOWED = [
    "smsEnabled","waEnabled","netgsmUser","netgsmPassword","netgsmHeader",
    "reminder48h","reminder3h","followupEnabled","followupHours",
    "tplCreated","tplConfirmed","tplCancelled","tplReminder48h","tplReminder3h","tplFollowup",
  ];
  const data = {};
  for (const key of ALLOWED) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const existing = await prisma.notificationSettings.findUnique({ where: { shopId } });
  const settings = existing
    ? await prisma.notificationSettings.update({ where: { shopId }, data })
    : await prisma.notificationSettings.create({ data: { shopId, ...data } });

  const { netgsmPassword, ...rest } = settings;
  return NextResponse.json({ ...rest, netgsmPasswordSet: !!netgsmPassword });
});
