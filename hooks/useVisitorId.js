"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "makas_visitor_id";

/**
 * Generates and persists a stable anonymous visitor ID in localStorage.
 * Returns the same ID across page refreshes and tabs.
 * Cleared only by explicit opt-out (GDPR) or cache clear.
 */
export function useVisitorId() {
  const [visitorId, setVisitorId] = useState(null);

  useEffect(() => {
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = `v_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
        localStorage.setItem(STORAGE_KEY, id);
      }
      setVisitorId(id);
    } catch {
      // Private browsing / localStorage blocked — use session-scoped ID
      setVisitorId(`vs_${Math.random().toString(36).slice(2, 14)}`);
    }
  }, []);

  function clearVisitorId() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setVisitorId(null);
  }

  return { visitorId, clearVisitorId };
}
