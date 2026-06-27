"use client";

// Captures cancellation reason + cancelledBy at cancel time. Both are optional
// at the API level but tracking *why* matters for client follow-up and for
// future analytics ("no-show rate by reason"). The /api/appointments/:id/status
// CANCELLED branch accepts these fields and persists them.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Store, Scissors } from "lucide-react";

const C = {
  surface:   "var(--makas-surface)",
  card:      "var(--makas-surface)",
  border:    "var(--makas-border)",
  primary:   "var(--makas-ink)",
  secondary: "var(--makas-ink-secondary)",
  muted:     "var(--makas-ink-muted)",
};

const ACTORS = [
  { value: "shop",   label: "Dükkan",  icon: Store },
  { value: "client", label: "Müşteri", icon: User },
  { value: "barber", label: "Berber",  icon: Scissors },
];

export default function CancelAppointmentModal({ appointment, onSubmit, onClose, defaultCancelledBy = "shop" }) {
  const [reason, setReason] = useState("");
  const [actor, setActor]   = useState(defaultCancelledBy);
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
    setBusy(true);
    try {
      await onSubmit({
        cancellationReason: reason.trim() || null,
        cancelledBy: actor,
      });
    } catch (e2) {
      setErr(e2.message || "Bir hata oluştu");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="ovl"
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
          <div style={{
            padding: "14px 18px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>Randevuyu İptal Et</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                {appointment.client?.name || appointment.client} · {appointment.date} {appointment.time}
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
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 6, display: "block" }}>
                İptal Eden
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {ACTORS.map(({ value, label, icon: Icon }) => {
                  const active = actor === value;
                  return (
                    <button
                      key={value} type="button" onClick={() => setActor(value)}
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

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 6, display: "block" }}>
                Sebep (opsiyonel)
              </label>
              <textarea
                value={reason} onChange={(e) => setReason(e.target.value)}
                maxLength={500} rows={3}
                placeholder="Örn. müşteri hastalandı, çakışan randevu, vb."
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.surface,
                  fontSize: 14, color: C.primary, outline: "none",
                  resize: "vertical", minHeight: 64, lineHeight: 1.4,
                }}
              />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, textAlign: "right" }}>
                {reason.length}/500
              </div>
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
                background: "#b91c1c", color: "#fff", border: "none",
                fontSize: 13, fontWeight: 700, cursor: busy ? "wait" : "pointer",
                minHeight: 44,
              }}>
                {busy ? "İptal ediliyor…" : "İptal Et"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
