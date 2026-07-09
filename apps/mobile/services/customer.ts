import { api } from "./api";
import type { CustomerProfile } from "@/types/api";

export type { CustomerProfile };

export const customerService = {
  getProfile: async () => {
    const { data } = await api.get<CustomerProfile>("/customer/profile");
    return data;
  },
  updateProfile: async (payload: Partial<CustomerProfile>) => {
    const { data } = await api.patch<CustomerProfile>("/customer/profile", payload);
    return data;
  },
  getFavorites: async () => {
    const { data } = await api.get<{ shopId: string }[]>("/customer/favorites");
    return data;
  },
  addFavorite: async (shopId: string) => {
    await api.post("/customer/favorites", { shopId });
  },
  removeFavorite: async (shopId: string) => {
    await api.delete(`/customer/favorites/${shopId}`);
  },
  deleteAccount: async () => {
    await api.delete("/customer/profile");
  },
};
