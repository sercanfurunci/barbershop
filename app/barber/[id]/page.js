import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BarberOldRoute({ params }) {
  const { id: slug } = await params;

  const barber = await prisma.barber.findFirst({
    where: { slug },
    select: { slug: true, shop: { select: { slug: true } } },
  });

  if (!barber) notFound();
  redirect(`/${barber.shop.slug}/barber/${barber.slug}`);
}
