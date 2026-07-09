import { useCallback } from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { useModeStore } from "@/store/mode";
import { authService } from "@/services/auth";

export function useAuth() {
  const { user, token, isLoading, setUser, setToken, setLoading, clear } = useAuthStore();
  const { setMode } = useModeStore();
  const queryClient = useQueryClient();

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token: t } = await authService.login(email, password);
    setUser(u);
    setToken(t);
    await setMode("business");
    // Route directly by role — no mode-select step for staff
    router.replace(u.role === "BARBER" ? "/(barber)" : "/(business)");
  }, [setUser, setToken, setMode]);

  const _doLogout = useCallback(async () => {
    queryClient.clear();
    clear();
    await setMode(null); // clears "business" from AsyncStorage → next launch shows Welcome
    router.replace("/(welcome)");
  }, [clear, setMode, queryClient]);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => {});
    await _doLogout();
  }, [_doLogout]);

  const logoutAll = useCallback(async () => {
    await authService.logoutAll().catch(() => {});
    await _doLogout();
  }, [_doLogout]);

  return { user, token, isLoading, login, logout, logoutAll, setLoading };
}
