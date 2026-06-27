"use client";

// Captures finalPrice + paymentMethod + tipAmount at completion time. The
// /api/appointments/:id/status endpoint requires finalPrice to compute the
// barber/shop commission split, so there's no "complete without price" path
// any more — this modal is the only way to mark COMPLETED from the admin UI.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, Banknote, ArrowRightLeft } from "lucide-react";

const C = {
  surface:   "var(--makas-surface)",
  card:      "var(--makas-surface)",
  border:    "var(--makas-border)",
  primary:   "var(--makas-ink)",
  secondary: "var(--makas-ink-secondary)",
  muted:     "var(--makas-ink-muted)",
};

const METHODS = [
  { value: "CASH",     label: "Nakit",  icon: Banknote },
  { value: "CARD",     label: "Kart",   icon: CreditCard },
  { value: "TRANSFER", label: "Havale", icon: ArrowRightLeft },
];

export default function CompleteAppointmentModal({ appointment, onSubmit, onClose }) {
  const initial = appointment?.price ?? "";
  const [finalPrice, setFinalPrice] = useState(initial === null ? "" : String(initial));
  const [method, setMethod] = useState("CASH");
  const [tip, setTip] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const price = Number(finalPrice);
    if (!Number.isFinite(price) || price < 0 || price > 100000) {
      setErr("Fiyat 0-100000 TL arasında olmalı"); return;
    }
    const tipAmount = tip === "" ? 0 : Number(tip);
    if (!Number.isFinite(tipAmount) || tipAmount < 0 || tipAmount > 10000) {
      setErr("Bahşiş 0-10000 TL arasında olmalı"); return;
    }
    setBusy(true);
    try {
      await onSubmit({ finalPrice: price, paymentMethod: method, tipAmount });
    } catch (e) {
      setErr(e.message || "Bir hata oluştu");
      setBusy(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${C.border}`, background: C.surface,
    fontSize: 15, color: C.primary, outline: "none",
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <AnimatePresence>
      <motion.div
        key="ovl"
        className="sa-modal-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, zIndex: 90,
        }}
      >
        <motion.div
          key="mdl"
          initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: C.card, borderRadius: 14, width: "100%", maxWidth: 420,
            border: `1px solid ${C.border}`,
            boxShadow: "0 24px 60px rgba(0,0,0,0.35)", overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>Randevuyu Tamamla</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {appointment.client?.name || appointment.client} · {appointment.service?.nameTr || appointment.service}
              </div>
            </div>
            <button onClick={onClose} aria-label="Kapat" style={{
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none", cursor: "pointer", color: C.muted,
            }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Final price */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 6, display: "block" }}>
                Tahsil edilen tutar (TL) *
              </label>
              <input
                type="number" inputMode="decimal" min="0" max="100000" step="1"
                value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)}
                autoFocus required style={inputStyle}
              />
            </div>

            {/* Payment method */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 6, display: "block" }}>
                Ödeme yöntemi
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {METHODS.map(({ value, label, icon: Icon }) => {
                  const active = method === value;
                  return (
                    <button
                      key={value} type="button" onClick={() => setMethod(value)}
                      style={{
                        padding: "10px 8px", borderRadius: 8, cursor: "pointer",
                        border: `1px solid ${active ? C.primary : C.border}`,
                        background: active ? "rgba(17,17,17,0.06)" : C.surface,
                        color: active ? C.primary : C.secondary,
                        fontSize: 12, fontWeight: active ? 600 : 500,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tip */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 6, display: "block" }}>
                Bahşiş (opsiyonel)
              </label>
              <input
                type="number" inputMode="decimal" min="0" max="10000" step="1"
                value={tip} onChange={(e) => setTip(e.target.value)}
                placeholder="0" style={inputStyle}
              />
            </div>

            {err && (
              <div style={{ fontSize: 12, color: "#b91c1c", padding: "8px 10px", background: "rgba(185,28,28,0.08)", borderRadius: 6 }}>
                {err}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button type="button" onClick={onClose} disabled={busy} style={{
                flex: 1, padding: "11px", borderRadius: 8,
                background: C.surface, color: C.secondary,
                border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer", minHeight: 44,
              }}>
                Vazgeç
              </button>
              <button type="submit" disabled={busy} style={{
                flex: 1.5, padding: "11px", borderRadius: 8,
                background: C.primary, color: "#fff", border: "none",
                fontSize: 13, fontWeight: 700, cursor: busy ? "wait" : "pointer",
                minHeight: 44,
              }}>
                {busy ? "Kaydediliyor…" : "Tamamla"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
