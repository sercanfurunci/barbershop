"use client";

import { createContext, useContext, useState, useEffect } from "react";
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
  const role = user?.role === "SUPER_ADMIN" ? "superadmin"
    : user?.role === "ADMIN" ? "admin"
    : user?.role === "BARBER" ? (user.barber?.slug ?? "barber")
    : null;

  const shopId = user?.shopId ?? user?.shop?.id ?? null;

  const login = async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await apiFetch("/api/auth/me", { method: "DELETE" }).catch(() => {});
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await apiFetch("/api/auth/me").catch(() => null);
    if (u) setUser(u);
    return u;
  };

  const updateUser = (patch) => setUser(prev => prev ? { ...prev, ...patch } : prev);

  return (
    <AuthContext.Provider value={{ user, role, shopId, loaded, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
