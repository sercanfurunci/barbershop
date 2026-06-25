import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

const IST_OFFSET_MIN = 3 * 60; // ponytail: server may run in UTC; clamp to Istanbul wall-clock
const MAX_MINUTES    = 12 * 60;

function nowIstanbul() {
  const t = new Date(Date.now() + IST_OFFSET_MIN * 60_000);
  const y = t.getUTCFullYear(), m = String(t.getUTCMonth() + 1).padStart(2, "0"), d = String(t.getUTCDate()).padStart(2, "0");
  const hh = String(t.getUTCHours()).padStart(2, "0"), mm = String(t.getUTCMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}`, minutes: t.getUTCHours() * 60 + t.getUTCMinutes() };
}

function minsToHHMM(m) {
  m = ((m % 1440) + 1440) % 1440; // wrap if break crosses midnight
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// POST — start an instant break: { minutes: number, label?: string }
export async function POST(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!payload.barberId) return forbidden();

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const minutes = Number(body.minutes);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > MAX_MINUTES) {
    return NextResponse.json({ error: "Geçersiz süre" }, { status: 400 });
  }
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim().slice(0, 40) : "Mola";

  const { date, minutes: nowMin } = nowIstanbul();
  const start = minsToHHMM(nowMin);
  const end   = minsToHHMM(nowMin + minutes);

  const brk = await prisma.barberBreak.create({
    data: { barberId: payload.barberId, date, start, end, label, dayOfWeek: null },
    select: { id: true, date: true, start: true, end: true, label: true },
  });
  return NextResponse.json(brk);
}

// DELETE — cancel today's one-off breaks for this barber
export async function DELETE(request) {
  const payload = await requireAuth(request);
  if (!payload) return unauthorized();
  if (!payload.barberId) return forbidden();

  const { date } = nowIstanbul();
  const { count } = await prisma.barberBreak.deleteMany({
    where: { barberId: payload.barberId, date },
  });
  return NextResponse.json({ deleted: count });
}
