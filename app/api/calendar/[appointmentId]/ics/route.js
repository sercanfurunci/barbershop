import { prisma } from "@/lib/prisma";
import { generateIcs, appointmentCalendarData } from "@/lib/calendar";

export const dynamic = "force-dynamic";

// GET /api/calendar/:appointmentId/ics
// Public — no auth required (appointmentId is a hard-to-guess cuid).
// Only exposes calendar-safe data: no client phone/email.
export async function GET(request, { params }) {
  const { appointmentId } = await params;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: { select: { nameTr: true, duration: true } },
      barber:  { select: { nameTr: true } },
      shop:    { select: { name: true, address: true, phone: true, status: true } },
    },
  }).catch(() => null);

  if (!appt || appt.shop?.status !== "ACTIVE") {
    return new Response("Not found", { status: 404 });
  }

  const data = appointmentCalendarData(appt);
  const ics  = generateIcs(data);
  const filename = `randevu-${appt.date}-${appt.time.replace(":", "")}.ics`;

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type":        "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control":       "no-store",
    },
  });
}
