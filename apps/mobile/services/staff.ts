import { api } from "./api";
import type { BarberAdmin, BarberHoliday } from "@/types/api";

export const staffService = {
  // ── Admin barber CRUD ──────────────────────────────────────────────────────

  list: async (): Promise<BarberAdmin[]> => {
    const { data } = await api.get<BarberAdmin[]>("/admin/barbers");
    return data;
  },

  get: async (id: string): Promise<BarberAdmin> => {
    const { data } = await api.get<BarberAdmin>(`/admin/barbers/${id}`);
    return data;
  },

  create: async (payload: {
    slug: string; nameTr: string; titleTr: string; avatar: string;
    email: string; password: string;
    nameEn?: string; titleEn?: string; bioTr?: string;
    yearsExp?: number; color?: string;
  }): Promise<BarberAdmin> => {
    const { data } = await api.post<BarberAdmin>("/admin/barbers", payload);
    return data;
  },

  update: async (id: string, payload: Partial<BarberAdmin>): Promise<BarberAdmin> => {
    const { data } = await api.patch<BarberAdmin>(`/admin/barbers/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/admin/barbers/${id}`);
  },

  // ── Admin holiday/leave management ────────────────────────────────────────

  listHolidays: async (): Promise<BarberHoliday[]> => {
    const { data } = await api.get<BarberHoliday[]>("/admin/holidays");
    return data;
  },

  addLeave: async (payload: {
    startDate: string; endDate: string; label?: string; barberId?: string;
  }): Promise<void> => {
    await api.post("/admin/holidays", payload);
  },

  deleteHoliday: async (id: string): Promise<void> => {
    await api.delete(`/admin/holidays/${id}`);
  },

  // ── Barber self-service ────────────────────────────────────────────────────

  toggleAvailability: async (available: boolean): Promise<void> => {
    await api.post("/barber/me/availability", { available });
  },

  myLeaves: async (): Promise<BarberHoliday[]> => {
    const { data } = await api.get<BarberHoliday[]>("/barber/me/leave");
    return data;
  },

  addMyLeave: async (payload: { startDate: string; endDate: string; label?: string }): Promise<void> => {
    await api.post("/barber/me/leave", payload);
  },

  deleteMyLeave: async (id?: string): Promise<void> => {
    const url = id ? `/barber/me/leave?id=${id}` : "/barber/me/leave";
    await api.delete(url);
  },
};
