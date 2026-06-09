import BarberDashboardClient from "@/components/admin/BarberDashboardClient";

export const dynamic = "force-dynamic";

export default async function BarberPage({ params }) {
  const { id } = await params;
  return <BarberDashboardClient barberId={id} />;
}
