"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "makas-auth";

// role: "admin" | barber id (e.g. "mehmet")
export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setRole(saved);
    } catch {}
    setLoaded(true);
  }, []);

  const login = (r) => {
    setRole(r);
    localStorage.setItem(STORAGE_KEY, r);
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ role, loaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
