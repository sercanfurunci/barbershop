import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const barbers = await prisma.barber.findMany({
    where: { available: true },
    include: { workingHours: true, breaks: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(barbers);
}
