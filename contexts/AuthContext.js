"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null); // { id, email, username, displayName, role, barber, shop }
  const [loaded, setLoaded] = useState(false);

  // Restore session from cookie on mount
  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  // role helpers — keep compatible with existing code
  const role = useMemo(() =>
    user?.role === "SUPER_ADMIN" ? "superadmin"
    : user?.role === "ADMIN" ? "admin"
    : user?.role === "BARBER" ? (user.barber?.slug ?? "barber")
    : null,
  [user?.role, user?.barber?.slug]);

  const shopId = useMemo(() => user?.shopId ?? user?.shop?.id ?? null, [user?.shopId, user?.shop?.id]);

  const login = useCallback(async (email, password, expectedRole) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, ...(expectedRole ? { expectedRole } : {}) }),
    });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/api/auth/me", { method: "DELETE" }).catch(() => {});
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await apiFetch("/api/auth/me").catch(() => null);
    if (u) setUser(u);
    return u;
  }, []);

  const updateUser = useCallback((patch) => setUser(prev => prev ? { ...prev, ...patch } : prev), []);

  const value = useMemo(
    () => ({ user, role, shopId, loaded, login, logout, refreshUser, updateUser }),
    [user, role, shopId, loaded, login, logout, refreshUser, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
