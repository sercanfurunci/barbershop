import { api, tokenStore } from "./api";
import type { User } from "@/types/api";

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  register: async (payload: {
    displayName?: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/register", payload);
    await tokenStore.set(data.token);
    return data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/login", { email, password });
    await tokenStore.set(data.token);
    return data;
  },

  refresh: async (): Promise<string | null> => {
    try {
      const { data } = await api.post<{ token: string }>("/auth/refresh");
      await tokenStore.set(data.token);
      return data.token;
    } catch {
      return null;
    }
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  logout: async (): Promise<void> => {
    try { await api.post("/auth/logout"); } catch {}
    await tokenStore.delete();
  },

  logoutAll: async (): Promise<void> => {
    try { await api.post("/auth/logout-all"); } catch {}
    await tokenStore.delete();
  },
};
