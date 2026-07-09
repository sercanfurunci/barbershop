import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/utils/queryKeys";
import { appointmentsService, type AppointmentFilters } from "@/services/appointments";
import { useAuthStore } from "@/store/auth";

export function useAppointments(filters?: AppointmentFilters) {
  const user = useAuthStore((s) => s.user);

  // BARBER role is always scoped to their own appointments server-side,
  // but enforcing client-side keeps the query key stable and prevents
  // a barber from accidentally fetching all shop appointments.
  const effectiveFilters: AppointmentFilters = {
    ...filters,
    ...(user?.role === "BARBER" && user.barber?.id
      ? { barberId: user.barber.id }
      : {}),
  };

  return useQuery({
    queryKey: queryKeys.appointments.filtered(effectiveFilters),
    queryFn:  () => appointmentsService.list(effectiveFilters),
    staleTime: 30_000,
    enabled:  !!user,
  });
}
