"use client";

import { useState, useCallback } from "react";
import { Heart, Share2, Link2, Check } from "lucide-react";

// Floating share + favorite bar for the salon detail page.
// Favorites require auth — 401 shows a brief "Giriş yapın" tooltip.
// Share uses Web Share API with copy-to-clipboard fallback.

export default function ShareFavoriteBar({ shopId, shopName }) {
  const [copied, setCopied]     = useState(false);
  const [favored, setFavored]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState("");

  const flash = (text, ms = 2200) => {
    setMsg(text);
    setTimeout(() => setMsg(""), ms);
  };

  const share = useCallback(async () => {
    const url = window.location.href;
    const text = `${shopName} — Online Randevu`;
    if (navigator.share) {
      try { await navigator.share({ title: text, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      flash("Bağlantı kopyalandı");
    }
  }, [shopName]);

  const toggleFavorite = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (favored) {
        const res = await fetch(`/api/customer/favorites/${shopId}`, { method: "DELETE" });
        if (res.status === 401) { flash("Favori eklemek için giriş yapın"); return; }
        if (res.ok) { setFavored(false); flash("Favorilerden çıkarıldı"); }
      } else {
        const res = await fetch("/api/customer/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId }),
        });
        if (res.status === 401) { flash("Favori eklemek için giriş yapın"); return; }
        if (res.ok) { setFavored(true); flash("Favorilere eklendi ♥"); }
      }
    } catch {
      flash("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }, [favored, loading, shopId]);

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
      {/* Share */}
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

      {/* Favorite */}
      <button
        onClick={toggleFavorite}
        aria-label={favored ? "Favorilerden çıkar" : "Favorilere ekle"}
        disabled={loading}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "10px 14px",
          background: favored ? "#fef2f2" : "transparent",
          border: `1px solid ${favored ? "#fca5a5" : "var(--makas-border)"}`,
          borderRadius: 10, cursor: loading ? "wait" : "pointer",
          fontSize: 13, fontWeight: 600,
          color: favored ? "#ef4444" : "var(--makas-ink-secondary)",
          minHeight: 40,
          transition: "all 0.18s",
        }}
      >
        <Heart size={15} fill={favored ? "currentColor" : "none"} />
      </button>

      {/* Toast */}
      {msg && (
        <span
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
            transform: "translateX(-50%)",
            background: "var(--makas-ink)", color: "#fff",
            padding: "6px 12px", borderRadius: 8,
            fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            pointerEvents: "none", zIndex: 100,
          }}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
