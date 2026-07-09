import { create } from "zustand";
import type { User } from "@/types/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

// ponytail: user object is in-memory only (SecureStore holds the token).
// No AsyncStorage persistence needed — bootstrap() in _layout re-hydrates
// from SecureStore + /api/auth/me on every app open. Avoids stale user
// data being served from a persisted snapshot.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ user: null, token: null }),
}));
