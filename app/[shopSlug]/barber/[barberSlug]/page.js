import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BarberDashboardClient from "@/components/admin/BarberDashboardClient";

export const dynamic = "force-dynamic";

export default async function BarberDashboardPage({ params }) {
  const { shopSlug, barberSlug } = await params;

  const barber = await prisma.barber.findFirst({
    where: { slug: barberSlug, shop: { slug: shopSlug } },
    select: { id: true },
  });

  if (!barber) notFound();

  return <BarberDashboardClient barberId={barberSlug} shopSlug={shopSlug} />;
}
