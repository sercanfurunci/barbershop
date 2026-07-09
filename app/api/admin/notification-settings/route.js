import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

function shopGuard(payload) {
  if (!payload) return { error: unauthorized() };
  if (payload.role === "SUPER_ADMIN") return { shopFilter: {} };
  if (payload.role !== "ADMIN" && payload.role !== "RECEPTIONIST") return { error: forbidden() };
  if (!payload.shopId) return { error: forbidden() };
  return { shopId: payload.shopId };
}

export async function GET(request) {
  const payload = await requireAuth(request);
  const guard   = shopGuard(payload);
  if (guard.error) return guard.error;

  const shopId = guard.shopId ?? new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({}, { status: 400 });

  const settings = await prisma.notificationSettings.findUnique({ where: { shopId } });
  if (!settings) return NextResponse.json({});
  // Redact stored credential — client only needs to know "is it set?"
  const { netgsmPassword, ...rest } = settings;
  return NextResponse.json({ ...rest, netgsmPasswordSet: !!netgsmPassword });
}

export async function PATCH(request) {
  const payload = await requireAuth(request);
  const guard   = shopGuard(payload);
  if (guard.error) return guard.error;

  const body   = await request.json();
  const shopId = guard.shopId ?? body.shopId;
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

  return NextResponse.json(settings);
}
