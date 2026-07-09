import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth";
import { useModeStore } from "@/store/mode";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";

export default function Index() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const { mode, isHydrated, hydrate } = useModeStore();
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    // Wait for both auth bootstrap (network call) and mode hydration (AsyncStorage) to finish.
    if (authLoading || !isHydrated) return;

    // mode="business" is the only value ever persisted to AsyncStorage.
    if (mode === "business") {
      if (user) {
        router.replace(user.role === "BARBER" ? "/(barber)" : "/(business)");
      } else {
        // Business mode remembered but no valid session → go to login.
        router.replace("/(auth)/login");
      }
      return;
    }

    // mode="customer" can only be set in-memory during the same session
    // (Welcome screen sets it after the user taps "Kuaför Bul"). It is never
    // written to AsyncStorage, so on a fresh launch this branch is unreachable.
    if (mode === "customer") {
      router.replace("/(customer)");
      return;
    }

    // mode=null: fresh install, first launch, or after logout.
    if (user) {
      // User is logged in but chose no mode yet (e.g., post-login).
      router.replace("/(mode-select)");
    } else {
      router.replace("/(welcome)");
    }
  }, [authLoading, isHydrated, mode, user]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors[scheme].background }}>
      <ActivityIndicator color={Colors[scheme].foreground} />
    </View>
  );
}
