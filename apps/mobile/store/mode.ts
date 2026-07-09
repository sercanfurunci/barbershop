import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AppMode = "customer" | "business" | null;

interface ModeState {
  mode: AppMode;
  isHydrated: boolean;
  setMode: (mode: AppMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useModeStore = create<ModeState>((set) => ({
  mode: null,
  isHydrated: false,
  setMode: async (mode) => {
    set({ mode });
    // ponytail: only persist business mode. Guest/customer sessions are ephemeral —
    // persisting "customer" would skip the Welcome Screen on every relaunch.
    if (mode === "business") {
      await AsyncStorage.setItem("appMode", "business");
    } else {
      await AsyncStorage.removeItem("appMode");
    }
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem("appMode");
      // Only "business" is ever written, so this is always "business" or null.
      const mode = stored === "business" ? "business" : null;
      set({ mode, isHydrated: true });
    } catch {
      set({ mode: null, isHydrated: true });
    }
  },
}));
