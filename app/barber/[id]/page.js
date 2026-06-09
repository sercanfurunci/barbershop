import { barbers } from "@/lib/data";
import BarberDashboardClient from "@/components/admin/BarberDashboardClient";

export function generateStaticParams() {
  return barbers.map((b) => ({ id: b.id }));
}

export default async function BarberPage({ params }) {
  const { id } = await params;
  return <BarberDashboardClient barberId={id} />;
}
