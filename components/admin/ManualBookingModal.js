"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { barbers, services } from "@/lib/data";
import { todayStr } from "@/lib/utils";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { X, Check, Phone, User, Calendar, Clock } from "lucide-react";

const C = {
  bg:      "#F8F6F2",
  card:    "#FFFFFF",
  modal:   "#FFFFFF",
  border:  "rgba(17,17,17,0.08)",
  surface: "#F1EEE8",
  primary: "#111111",
  secondary:"#57514B",
  muted:   "#6E6760",
  red:     "#C62828",
};

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

function generateTimeSlots(startH, endH) {
  const slots = [];
  for (let h = startH; h < endH; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

export default function ManualBookingModal({ onClose, defaultBarberId = "", initialDate = "" }) {
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

  const selectedService = services.find((s) => s.id === form.serviceId);
  const selectedBarber = barbers.find((b) => b.id === form.barberId);
  const timeSlots = generateTimeSlots(9, 21);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.client.trim()) { setError("Müşteri adı gerekli"); return; }
    if (!form.serviceId) { setError("Hizmet seçin"); return; }
    if (!form.barberId) { setError("Berber seçin"); return; }
    if (!form.date) { setError("Tarih seçin"); return; }
    if (!form.time) { setError("Saat seçin"); return; }
    setError("");

    addAppointment({
      client: form.client.trim(),
      phone: form.phone.trim(),
      serviceId: form.serviceId,
      service: selectedService?.name.tr ?? form.serviceId,
      barberId: form.barberId,
      barber: selectedBarber?.name ?? form.barberId,
      date: form.date,
      time: form.time,
      duration: selectedService?.duration ?? 45,
      price: selectedService?.price ?? 0,
      notes: form.notes.trim(),
      source: "phone",
      status: "confirmed",
    });

    setSaved(true);
    setTimeout(onClose, 1200);
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
          zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px",
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
            maxHeight: "90vh",
            overflowY: "auto",
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
              <div style={{ fontSize: "11px", color: C.red, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500, marginBottom: "3px" }}>
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
                    width: "56px", height: "56px", background: C.red,
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Check size={24} color="#fff" />
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
                        {s.name.tr} — ₺{s.price.toLocaleString()} ({s.duration}dk)
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
                        {b.name}{!b.available ? " (İzinli)" : ""}
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
                    >
                      <option value="">Saat Seçin</option>
                      {timeSlots.map((t) => (
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
                      {selectedService.name.tr} · {selectedService.duration}dk
                    </div>
                    <div style={{ fontSize: "16px", color: C.primary, fontWeight: 600 }}>
                      ₺{selectedService.price.toLocaleString()}
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{ fontSize: "12px", color: C.red, padding: "8px 12px", background: "rgba(198,40,40,0.08)", borderRadius: "6px", border: "1px solid rgba(198,40,40,0.2)" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    width: "100%", height: "44px",
                    background: C.red, color: "#fff",
                    border: "none", borderRadius: "10px",
                    fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", letterSpacing: "0.03em",
                    marginTop: "4px",
                  }}
                >
                  Randevuyu Kaydet
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
