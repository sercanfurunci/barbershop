import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { businessName, name, phone, email, message } = body;

  if (!businessName?.trim() || !name?.trim() || !phone?.trim()) {
    return NextResponse.json(
      { ok: false, error: "businessName, name ve phone zorunludur." },
      { status: 400 }
    );
  }

  await prisma.lead.create({
    data: {
      businessName: businessName.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      message: message?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
