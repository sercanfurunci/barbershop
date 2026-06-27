"use client";

// Walk-in capture: customer just sat in the chair, no online booking.
// Different shape from ManualBookingModal — no date/time picker (uses now),
// finalPrice + paymentMethod required, optional custom service name. Submits
// to the dedicated POST /api/appointments/walkin which marks COMPLETED in
// one transaction and runs the same revenue split as the regular completion
// flow.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { X, Check, User, Phone, Banknote, CreditCard, ArrowRightLeft } from "lucide-react";
import { C } from "@/lib/adminTheme";

const PAYMENTS = [
  { value: "CASH",     label: "Nakit",  icon: Banknote },
  { value: "CARD",     label: "Kart",   icon: CreditCard },
  { value: "TRANSFER", label: "Havale", icon: ArrowRightLeft },
];

const inputStyle = {
  width: "100%", height: 40, background: C.surface,
  border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px",
  fontSize: 13, color: C.primary, outline: "none", boxSizing: "border-box",
};

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, color: C.secondary,
        letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, fontWeight: 500,
      }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function WalkInModal({ onClose, defaultBarberId = "" }) {
  useBodyScrollLock();
  const { refresh } = useAppointments();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    barberId: defaultBarberId,
    serviceId: "",
    customServiceName: "",
    customDuration: 30,
    finalPrice: "",
    paymentMethod: "CASH",
    tipAmount: "",
  });
  const [services, setServices] = useState([]);
  const [barbers, setBarbers]   = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/services").then(r => r.json()).then(d => setServices(Array.isArray(d) ? d : [])).catch(() => {});
    fetch("/api/admin/barbers").then(r => r.json()).then(d => setBarbers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isCustom = form.serviceId === "__custom__";

  // Prefill price from the picked service so the cashier doesn't retype the
  // catalog price for the common case — they can still override.
  useEffect(() => {
    if (!isCustom && form.serviceId) {
      const s = services.find(x => x.id === form.serviceId);
      if (s?.price != null) setForm(f => ({ ...f, finalPrice: String(s.price) }));
    }
  }, [form.serviceId, isCustom, services]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (form.name.trim().length < 2) { setErr("İsim gerekli"); return; }
    if (!form.barberId) { setErr("Berber seçin"); return; }
    if (!form.serviceId) { setErr("Hizmet seçin"); return; }
    if (isCustom && form.customServiceName.trim().length < 2) { setErr("Özel hizmet adı gerekli"); return; }
    const price = Number(form.finalPrice);
    if (!Number.isFinite(price) || price < 0 || price > 100000) { setErr("Geçerli fiyat girin (0-100000)"); return; }

    setBusy(true);
    try {
      await apiFetch("/api/appointments/walkin", {
        method: "POST",
        body: JSON.stringify({
          name:        form.name.trim(),
          phone:       form.phone.trim() || undefined,
          barberId:    form.barberId,
          serviceId:   isCustom ? undefined : form.serviceId,
          customServiceName: isCustom ? form.customServiceName.trim() : undefined,
          duration:    isCustom ? Number(form.customDuration) : undefined,
          finalPrice:  price,
          paymentMethod: form.paymentMethod,
          tipAmount:   form.tipAmount === "" ? 0 : Number(form.tipAmount),
        }),
      });
      setSaved(true);
      refresh();
      setTimeout(onClose, 1100);
    } catch (e2) {
      setErr(e2.message || "Kayıt başarısız");
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="ovl"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: "fixed", inset: 0, background: "rgba(17,17,17,0.45)",
          zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center",
          overflowY: "auto", padding: 20,
        }}
      >
        <motion.div
          key="mdl"
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.22 }}
          style={{
            background: C.modal, border: `1px solid ${C.border}`,
            borderRadius: 16, width: "100%", maxWidth: 480, maxHeight: "90dvh",
            overflowY: "auto",
          }}
        >
          <div style={{
            padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{
                fontSize: 11, color: C.primary, textTransform: "uppercase",
                letterSpacing: "0.15em", fontWeight: 500, marginBottom: 3,
              }}>
                Walk-in (Şimdi Geldi)
              </div>
              <h2 style={{ fontSize: 18, color: C.primary, fontWeight: 300 }}>
                Anlık Müşteri Kaydı
              </h2>
            </div>
            <button onClick={onClose} aria-label="Kapat" style={{
              width: 32, height: 32, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.secondary,
            }}>
              <X size={15} />
            </button>
          </div>

          <form onSubmit={submit} style={{ padding: 24 }}>
            {saved ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{
                  width: 56, height: 56, background: C.primary,
                  borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", margin: "0 auto 16px",
                }}>
                  <Check size={24} color="#fff" />
                </div>
                <div style={{ fontSize: 16, color: C.primary, fontWeight: 500 }}>
                  Kaydedildi
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Müşteri Adı *">
                    <input type="text" value={form.name} placeholder="Ad Soyad"
                      onChange={(e) => set("name", e.target.value)} style={inputStyle} />
                  </Field>
                  <Field label="Telefon" hint="Opsiyonel; sadakat için faydalı">
                    <input type="tel" value={form.phone} placeholder="0532 000 0000"
                      onChange={(e) => set("phone", e.target.value)} style={inputStyle} />
                  </Field>
                </div>

                <Field label="Berber *">
                  <select value={form.barberId}
                    onChange={(e) => set("barberId", e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}>
                    <option value="">Berber Seçin</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>{b.nameTr}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Hizmet *">
                  <select value={form.serviceId}
                    onChange={(e) => set("serviceId", e.target.value)}
                    style={{ ...inputStyle, cursor: "pointer", appearance: "none" }}>
                    <option value="">Hizmet Seçin</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameTr} ({s.duration}dk)
                      </option>
                    ))}
                    <option value="__custom__">+ Özel hizmet…</option>
                  </select>
                </Field>

                {isCustom && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Özel Hizmet Adı *">
                      <input type="text" value={form.customServiceName}
                        placeholder="Sakal düzeltme"
                        onChange={(e) => set("customServiceName", e.target.value)}
                        style={inputStyle} />
                    </Field>
                    <Field label="Süre (dk)">
                      <input type="number" min={5} max={480} step={5}
                        value={form.customDuration}
                        onChange={(e) => set("customDuration", e.target.value)}
                        style={inputStyle} />
                    </Field>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tahsil Edilen (TL) *">
                    <input type="number" min={0} max={100000} step={1}
                      value={form.finalPrice}
                      onChange={(e) => set("finalPrice", e.target.value)}
                      style={inputStyle} required />
                  </Field>
                  <Field label="Bahşiş (TL)">
                    <input type="number" min={0} max={10000} step={1}
                      value={form.tipAmount} placeholder="0"
                      onChange={(e) => set("tipAmount", e.target.value)}
                      style={inputStyle} />
                  </Field>
                </div>

                <Field label="Ödeme">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {PAYMENTS.map(({ value, label, icon: Icon }) => {
                      const active = form.paymentMethod === value;
                      return (
                        <button
                          key={value} type="button" onClick={() => set("paymentMethod", value)}
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
                </Field>

                {err && (
                  <div style={{
                    fontSize: 12, color: "#b91c1c", padding: "8px 12px",
                    background: "rgba(185,28,28,0.08)", borderRadius: 6,
                  }}>{err}</div>
                )}

                <button type="submit" disabled={busy} style={{
                  width: "100%", height: 44,
                  background: C.primary, color: "#fff",
                  border: "none", borderRadius: 10,
                  fontSize: 13, fontWeight: 600, letterSpacing: "0.03em",
                  cursor: busy ? "wait" : "pointer", marginTop: 4,
                }}>
                  {busy ? "Kaydediliyor…" : "Walk-in Kaydet"}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
