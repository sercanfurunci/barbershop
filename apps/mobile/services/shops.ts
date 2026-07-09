import { api } from "./api";
import type { GuestBooking, PublicAppointment, PublicReview, PublicShop } from "@/types/api";

// Uses public endpoints — no auth required
export const shopsService = {
  list: async (params?: {
    city?: string; district?: string; search?: string;
    shopType?: string; service?: string;
    minRating?: number; openNow?: boolean;
    sort?: string; take?: number; skip?: number;
  }) => {
    const { data } = await api.get<{ shops: PublicShop[]; total: number } | PublicShop[]>("/shops", { params });
    // API returns { shops, total } — handle both shapes for safety
    return Array.isArray(data) ? data : (data as { shops: PublicShop[] }).shops;
  },
  bySlug: async (slug: string) => {
    const { data } = await api.get<PublicShop>(`/shops/${slug}`);
    return data;
  },
  reviews: async (slug: string) => {
    const { data } = await api.get<{ reviews: PublicReview[]; summary: unknown }>(`/shops/${slug}/reviews`);
    return data.reviews;
  },
  availability: async (params: { shopId: string; barberId: string; serviceId: string; date: string }) => {
    const { data } = await api.get<{ slots: string[]; holiday?: string }>("/availability", { params });
    return data;
  },
  book: async (payload: GuestBooking) => {
    const { data } = await api.post("/appointments", { ...payload, source: "ONLINE" });
    return data as { id: string; status: string };
  },
  myAppointments: async (phone: string) => {
    const { data } = await api.get<PublicAppointment[]>("/public/appointments", { params: { phone } });
    return data;
  },
};
