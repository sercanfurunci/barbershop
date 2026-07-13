"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [shopIds, setShopIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  const refetch = useCallback(async () => {
    if (!user || user.role !== "CUSTOMER") { setShopIds(new Set()); setLoaded(true); return; }
    try {
      const list = await apiFetch("/api/customer/favorites");
      setShopIds(new Set(Array.isArray(list) ? list.map(f => f.shopId) : []));
    } catch { /* ignore */ }
    finally { setLoaded(true); }
  }, [user?.id, user?.role]);

  useEffect(() => { refetch(); }, [refetch]);

  const add    = useCallback((shopId) => setShopIds(s => { const n = new Set(s); n.add(shopId);    return n; }), []);
  const remove = useCallback((shopId) => setShopIds(s => { const n = new Set(s); n.delete(shopId); return n; }), []);
  const isFavorite = useCallback((shopId) => shopIds.has(shopId), [shopIds]);

  const value = useMemo(
    () => ({ shopIds, loaded, isFavorite, add, remove, refetch }),
    [shopIds, loaded, isFavorite, add, remove, refetch]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be inside FavoritesProvider");
  return ctx;
}
