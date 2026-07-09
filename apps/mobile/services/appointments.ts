import { api } from "./api";
import type { Appointment } from "@/types/api";

export interface AppointmentFilters {
  date?: string;
  barberId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export const appointmentsService = {
  list: async (filters?: AppointmentFilters): Promise<Appointment[]> => {
    const { data } = await api.get<Appointment[]>("/appointments", { params: filters });
    return data;
  },

  updateStatus: async (id: string, status: string, extra?: { finalPrice?: number; tipAmount?: number; paymentMethod?: string }): Promise<Appointment> => {
    const { data } = await api.patch<Appointment>(`/appointments/${id}/status`, { status, ...extra });
    return data;
  },
};
