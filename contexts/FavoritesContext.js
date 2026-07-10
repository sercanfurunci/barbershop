"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [shopIds, setShopIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!user || user.role !== "CUSTOMER") { setShopIds(new Set()); setLoaded(true); return; }
    try {
      const res = await fetch("/api/customer/favorites");
      if (!res.ok) return;
      const list = await res.json();
      setShopIds(new Set(Array.isArray(list) ? list.map(f => f.shopId) : []));
    } catch { /* ignore */ }
    finally { setLoaded(true); }
  }, [user]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const add = useCallback((shopId) => setShopIds(s => { const n = new Set(s); n.add(shopId); return n; }), []);
  const remove = useCallback((shopId) => setShopIds(s => { const n = new Set(s); n.delete(shopId); return n; }), []);
  const isFavorite = useCallback((shopId) => shopIds.has(shopId), [shopIds]);

  return (
    <FavoritesContext.Provider value={{ shopIds, loaded, isFavorite, add, remove, refetch: fetch_ }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be inside FavoritesProvider");
  return ctx;
}
