"use client";

import { useState, useCallback } from "react";
import { Heart, Share2, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { toast } from "sonner";

export default function ShareFavoriteBar({ shopId, shopName }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, add, remove } = useFavorites();
  const [copied, setCopied]   = useState(false);
  const [pending, setPending] = useState(false);

  const favored = isFavorite(shopId);

  const share = useCallback(async () => {
    const url = window.location.href;
    const text = `${shopName} — Online Randevu`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Bağlantı kopyalandı");
    }
  }, [shopName]);

  const toggleFavorite = useCallback(async () => {
    if (pending) return;
    if (!user || user.role !== "CUSTOMER") {
      const returnUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    const wasActive = favored;
    // Optimistic update
    if (wasActive) remove(shopId); else add(shopId);
    setPending(true);
    try {
      let res;
      if (wasActive) {
        res = await fetch(`/api/customer/favorites/${shopId}`, { method: "DELETE" });
      } else {
        res = await fetch("/api/customer/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId }),
        });
      }
      if (!res.ok) throw new Error("failed");
      if (wasActive) {
        toast("🤍 Favorilerden çıkarıldı");
      } else {
        toast.success("❤️ Favorilere eklendi");
      }
    } catch {
      // Rollback
      if (wasActive) add(shopId); else remove(shopId);
      toast.error("❌ Favoriler güncellenemedi. Tekrar deneyin.");
    } finally {
      setPending(false);
    }
  }, [favored, pending, shopId, user, add, remove]);

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={share}
        aria-label="Paylaş"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 14px",
          background: "transparent",
          border: "1px solid var(--makas-border)",
          borderRadius: 10, cursor: "pointer",
          fontSize: 13, fontWeight: 600,
          color: "var(--makas-ink-secondary)",
          minHeight: 40,
        }}
      >
        {copied ? <Check size={15} /> : <Share2 size={15} />}
        <span style={{ display: "none" }} className="sm-inline">Paylaş</span>
      </button>

      <button
        onClick={toggleFavorite}
        aria-label={favored ? "Favorilerden çıkar" : "Favorilere ekle"}
        disabled={pending}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 14px",
          background: favored ? "#fef2f2" : "transparent",
          border: `1px solid ${favored ? "#fca5a5" : "var(--makas-border)"}`,
          borderRadius: 10, cursor: pending ? "wait" : "pointer",
          fontSize: 13, fontWeight: 600,
          color: favored ? "#ef4444" : "var(--makas-ink-secondary)",
          minHeight: 40,
          transition: "all 0.18s",
          transform: pending ? "scale(0.92)" : "scale(1)",
        }}
      >
        <Heart
          size={15}
          fill={favored ? "currentColor" : "none"}
          style={{
            transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
            transform: favored ? "scale(1.25)" : "scale(1)",
          }}
        />
      </button>
    </div>
  );
}
