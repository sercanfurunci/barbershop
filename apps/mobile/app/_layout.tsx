import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from "@expo-google-fonts/outfit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/auth";
import { authService } from "@/services/auth";
import { tokenStore, api } from "@/services/api";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "../global.css";

SplashScreen.preventAutoHideAsync();

// ponytail: skip in Expo Go — setNotificationHandler throws on SDK 54
if (!__DEV__) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 4xx — those are permanent failures (auth, not found, etc.)
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (typeof status === "number" && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

async function registerPushToken() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync();
    await api.post("/notifications/push-token", { token: pushToken }).catch(() => {});
  } catch {
    // Non-critical — don't block bootstrap
  }
}

function RootLayoutNav() {
  const colorScheme = (useColorScheme() ?? "light") as "light" | "dark";
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await tokenStore.get();
        if (token) {
          const user = await authService.me();
          setUser(user);
          registerPushToken();
        }
      } catch (err) {
        // Only wipe the token on explicit auth rejection (401/403).
        // Network errors (timeout, ECONNREFUSED, no connection) don't mean
        // the token is invalid — wiping it would silently log the user out
        // every time they open the app with spotty connectivity.
        const status = (err as { status?: number })?.status;
        const isAuthError = typeof status === "number" && status >= 400 && status < 500;
        if (isAuthError) {
          await tokenStore.delete();
        }
        // user stays null; routing logic handles this gracefully.
      } finally {
        setLoading(false);
        await SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, []);

  // Deep link handler — routes incoming makas:// URLs to the right screen
  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const { path } = Linking.parse(url);
      if (!path) return;
      // expo-router handles path → screen mapping automatically via scheme config
    });
    return () => sub.remove();
  }, []);

  // Notification tap → navigate to the right screen
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.screen) {
        const { router } = require("expo-router");
        router.push(data.screen);
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = (useColorScheme() ?? "light") as "light" | "dark";
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary colorScheme={colorScheme}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
