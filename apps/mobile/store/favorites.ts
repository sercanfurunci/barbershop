import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { customerService } from "@/services/customer";
import { useAuthStore } from "@/store/auth";

const KEY = "favorites";

interface FavoritesState {
  ids: string[];
  isHydrated: boolean;
  toggle: (shopId: string) => Promise<void>;
  hydrate: () => Promise<void>;
  syncFromBackend: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: [],
  isHydrated: false,

  toggle: async (shopId) => {
    const current = get().ids;
    const isFav = current.includes(shopId);
    const next = isFav ? current.filter((id) => id !== shopId) : [...current, shopId];
    set({ ids: next });
    // Persist locally (guest + logged-in both keep local copy)
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    // Sync to backend if logged in
    const user = useAuthStore.getState().user;
    if (user) {
      try {
        if (isFav) {
          await customerService.removeFavorite(shopId);
        } else {
          await customerService.addFavorite(shopId);
        }
      } catch {
        // Backend sync failure is non-fatal; local state already updated
      }
    }
  },

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ ids: raw ? JSON.parse(raw) : [], isHydrated: true });
    } catch {
      set({ ids: [], isHydrated: true });
    }
  },

  syncFromBackend: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      const remote = await customerService.getFavorites();
      const remoteIds = remote.map((f) => f.shopId);
      // Merge: union of local + remote
      const local = get().ids;
      const merged = Array.from(new Set([...local, ...remoteIds]));
      set({ ids: merged });
      await AsyncStorage.setItem(KEY, JSON.stringify(merged));
    } catch {
      // Non-fatal; keep local state
    }
  },
}));
