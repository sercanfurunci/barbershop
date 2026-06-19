import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req) {
  // 3 leads per 10 minutes per IP
  const ip = getIp(req);
  const rl = rateLimit(`leads:${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Çok fazla istek. Lütfen bekleyin." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { businessName, name, phone, email, message } = body;

  if (!businessName?.trim() || !name?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { ok: false, error: "businessName, name ve phone zorunludur." },
      { status: 400 }
    );
  }

  // Length caps to prevent abuse
  if (businessName.trim().length > 120) return NextResponse.json({ ok: false, error: "businessName çok uzun." }, { status: 400 });
  if (name.trim().length > 80)         return NextResponse.json({ ok: false, error: "name çok uzun." },         { status: 400 });
  if (phone.trim().length > 20)        return NextResponse.json({ ok: false, error: "phone çok uzun." },        { status: 400 });
  if (email && email.trim().length > 120) return NextResponse.json({ ok: false, error: "email çok uzun." },     { status: 400 });
  if (message && message.trim().length > 1000) return NextResponse.json({ ok: false, error: "Mesaj çok uzun." },{ status: 400 });

  // Basic email format check
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ ok: false, error: "Geçersiz e-posta formatı." }, { status: 400 });
  }

  await prisma.lead.create({
    data: {
      businessName: businessName.trim(),
      name:         name.trim(),
      phone:        phone.trim(),
      email:        email?.trim() || null,
      message:      message?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
