import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const barbers = await prisma.barber.findMany({
      where: { available: true },
      include: { workingHours: true, breaks: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(barbers);
  } catch (err) {
    console.error("[GET /api/barbers]", err);
    return NextResponse.json({ error: "Sunucu hatası", detail: err.message }, { status: 500 });
  }
}
