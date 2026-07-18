"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { todayStr } from "@/lib/utils";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { X, Check, Phone, User, Calendar, Clock } from "lucide-react";

import { C, SHADOW } from "@/lib/adminTheme";

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: C.secondary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 500 }}>
        {Icon && <Icon size={10} />}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", height: "40px",
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "13px",
  color: C.primary,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
};


export default function ManualBookingModal({ onClose, defaultBarberId = "", initialDate = "" }) {
  useBodyScrollLock();
  const { addAppointment } = useAppointments();
  const [form, setForm] = useState({
    client: "",
    phone: "",
    serviceId: "",
    barberId: defaultBarberId,
    date: initialDate || todayStr(),
    time: "",
    notes: "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsMeta, setSlotsMeta] = useState({ loading: false, holiday: null, message: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/services").then(r => r.json()).then(data => setServices(Array.isArray(data) ? data : [])).catch(() => {});
    fetch("/api/admin/barbers").then(r => r.json()).then(data => setBarbers(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const selectedService = services.find((s) => s.id === form.serviceId);
  const selectedBarber = barbers.find((b) => b.id === form.barberId);

  // Ask the same endpoint the public booking uses — so admin selection honors
  // working hours / breaks / holidays / existing appointments in one query.
  useEffect(() => {
    const shop = selectedBarber?.shopId;
    if (!form.barberId || !form.serviceId || !form.date || !shop) return;
    let cancelled = false;
    apiFetch(`/api/availability?shopId=${shop}&barberId=${form.barberId}&serviceId=${form.serviceId}&date=${form.date}`)
      .then((r) => {
        if (cancelled) return;
        setSlots(Array.isArray(r.slots) ? r.slots : []);
        setSlotsMeta({
          loading: false,
          holiday: r.holiday ?? null,
          message: (r.slots?.length ?? 0) === 0 && !r.holiday ? "Bu gün boş saat yok." : null,
        });
      })
      .catch(() => {
        if (!cancelled) { setSlots([]); setSlotsMeta({ loading: false, holiday: null, message: "Uygun saatler alınamadı." }); }
      });
    return () => { cancelled = true; };
  }, [form.barberId, form.serviceId, form.date, selectedBarber?.shopId]);

  // Change any field that invalidates the fetched slot list → also drop the
  // stale time so we never submit a slot that's since fallen outside the window.
  const set = (k, v) => setForm((f) => {
    const next = { ...f, [k]: v };
    if (k === "barberId" || k === "serviceId" || k === "date") {
      next.time = "";
      // Mark meta as loading so the dropdown shows "Yükleniyor…" until the effect fires.
      if (next.barberId && next.serviceId && next.date) {
        setSlots([]);
        setSlotsMeta({ loading: true, holiday: null, message: null });
      } else {
        setSlots([]);
        setSlotsMeta({ loading: false, holiday: null, message: null });
      }
    }
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.client.trim()) { setError("Müşteri adı gerekli"); return; }
    if (!form.serviceId) { setError("Hizmet seçin"); return; }
    if (!form.barberId) { setError("Berber seçin"); return; }
    if (!form.date) { setError("Tarih seçin"); return; }
    if (!form.time) { setError("Saat seçin"); return; }
    setError("");

    setBusy(true);
    try {
      await addAppointment({
        client: form.client.trim(),
        phone: form.phone.trim(),
        serviceId: form.serviceId,
        service: selectedService?.nameTr ?? form.serviceId,
        barberId: form.barberId,
        barber: selectedBarber?.nameTr ?? form.barberId,
        date: form.date,
        time: form.time,
        duration: selectedService?.duration ?? 45,
        price: selectedService?.price ?? 0,
        notes: form.notes.trim(),
        source: "MANUAL",
        status: "confirmed",
      });
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.message || "Randevu kaydedilemedi");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(17,17,17,0.4)",
          zIndex: 80,
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: C.modal,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            width: "100%",
            maxWidth: "480px",
            maxHeight: "90dvh",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11px", color: C.primary, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500, marginBottom: "3px" }}>
                Telefon Randevusu
              </div>
              <h2 style={{ fontSize: "18px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em" }}>
                Yeni Randevu Ekle
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "32px", height: "32px",
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.secondary,
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
            {saved ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "24px 0" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  style={{
                    width: "56px", height: "56px", background: C.primary,
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Check size={24} color="var(--makas-bg)" />
                </motion.div>
                <div style={{ fontSize: "16px", color: C.primary, fontWeight: 500 }}>Randevu Eklendi</div>
                <div style={{ fontSize: "12px", color: C.secondary, marginTop: "4px" }}>
                  {form.client} — {form.time}
                </div>
              </motion.div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Client */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Müşteri Adı" icon={User}>
                    <input
                      type="text"
                      placeholder="Ad Soyad"
                      value={form.client}
                      onChange={(e) => set("client", e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Telefon" icon={Phone}>
                    <input
                      type="tel"
                      placeholder="0532 000 0000"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {/* Service */}
                <Field label="Hizmet">
                  <select
                    value={form.serviceId}
                    onChange={(e) => set("serviceId", e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Hizmet Seçin</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameTr} — {s.price == null ? "Sorulur" : `₺${s.price.toLocaleString()}`} ({s.duration}dk)
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Barber */}
                <Field label="Berber">
                  <select
                    value={form.barberId}
                    onChange={(e) => set("barberId", e.target.value)}
                    style={selectStyle}
                  >
                    <option value="">Berber Seçin</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameTr}{!b.available ? " (İzinli)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tarih" icon={Calendar}>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      style={{ ...inputStyle, colorScheme: "dark" }}
                    />
                  </Field>
                  <Field label="Saat" icon={Clock}>
                    <select
                      value={form.time}
                      onChange={(e) => set("time", e.target.value)}
                      style={selectStyle}
                      disabled={slotsMeta.loading || slots.length === 0}
                    >
                      <option value="">
                        {slotsMeta.loading ? "Yükleniyor…"
                          : slotsMeta.holiday ? `Tatil: ${slotsMeta.holiday}`
                          : slots.length === 0 ? (slotsMeta.message ?? "Önce hizmet/berber/tarih")
                          : "Saat Seçin"}
                      </option>
                      {slots.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                {/* Notes */}
                <Field label="Not (Opsiyonel)">
                  <textarea
                    placeholder="Özel istek veya not..."
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    style={{
                      ...inputStyle,
                      height: "70px",
                      padding: "10px 12px",
                      resize: "none",
                      lineHeight: 1.5,
                    }}
                  />
                </Field>

                {/* Service summary */}
                {selectedService && (
                  <div
                    style={{
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: "8px", padding: "12px 14px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: C.secondary }}>
                      {selectedService.nameTr} · {selectedService.duration}dk
                    </div>
                    <div style={{ fontSize: "16px", color: C.primary, fontWeight: 600 }}>
                      {selectedService.price == null ? "Sorulur" : `₺${selectedService.price.toLocaleString()}`}
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ fontSize: "12px", color: C.primary, padding: "8px 12px", background: "rgba(17,17,17,0.08)", borderRadius: "6px", border: "1px solid rgba(17,17,17,0.2)" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    width: "100%", height: "44px",
                    background: C.primary, color: "var(--makas-bg)",
                    border: "none", borderRadius: "10px",
                    fontSize: "13px", fontWeight: 600,
                    cursor: busy ? "wait" : "pointer", letterSpacing: "0.03em",
                    marginTop: "4px",
                    opacity: busy ? 0.7 : 1,
                  }}
                >
                  {busy ? "Kaydediliyor…" : "Randevuyu Kaydet"}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
