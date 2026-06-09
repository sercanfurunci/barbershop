"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null); // { id, email, role, barber }
  const [loaded, setLoaded] = useState(false);

  // Restore session from cookie on mount
  useEffect(() => {
    apiFetch("/api/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoaded(true));
  }, []);

  // role helpers — keep compatible with existing code
  const role = user?.role === "ADMIN" ? "admin"
    : user?.role === "BARBER" ? (user.barber?.slug ?? "barber")
    : null;

  const login = async (emailOrRole, password) => {
    // Support legacy one-click login (dev shortcut) → map to real credentials
    let email = emailOrRole;
    let pwd   = password;

    if (!password) {
      // Legacy: emailOrRole is "admin" or barber slug like "mehmet"
      email = emailOrRole === "admin" ? "admin@makas.com" : `${emailOrRole}@makas.com`;
      pwd   = emailOrRole === "admin" ? "admin123" : "barber123";
    }

    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pwd }),
    });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await apiFetch("/api/auth/me", { method: "DELETE" }).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
