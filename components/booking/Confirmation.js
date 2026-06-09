"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Calendar, Clock, User, Scissors, Phone, Mail, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";

const C = {
  bg:       "#070707",
  card:     "#0f0f14",
  border:   "rgba(255,255,255,0.07)",
  surface:  "#16161e",
  primary:  "#F0EDE8",
  secondary:"#6b6870",
  muted:    "#2e2d35",
  red:      "#CC1A1A",
};

export default function Confirmation({ booking, onBack, lang = "tr", tx }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const s4 = tx?.booking?.step4 ?? {};
  const success = tx?.booking?.success ?? {};
  const locale = lang === "tr" ? dateFnsTr : enUS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      toast.error(s4.errorMsg ?? "Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
    toast.success(success.confirmed ?? "Randevunuz onaylandı!");
  };

  const serviceName = booking.service
    ? (typeof booking.service.name === "object" ? booking.service.name[lang] : booking.service.name)
    : "";

  const barberName = booking.barber
    ? (typeof booking.barber.name === "object" ? booking.barber.name[lang] : booking.barber.name)
    : "";

  if (submitted) {
    const [titleLine1, titleLine2] = success.title
      ? success.title(form.name.split(" ")[0])
      : [`Görüşürüz,`, `${form.name.split(" ")[0]}.`];

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center py-16 max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 240, damping: 18 }}
          className="flex items-center justify-center mb-8"
          style={{ width: "80px", height: "80px", background: C.red, borderRadius: "20px" }}
        >
          <Check size={36} color="#fff" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full"
        >
          <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, marginBottom: "16px", fontWeight: 500 }}>
            {success.badge}
          </div>
          <h2
            className="font-display font-light"
            style={{ fontSize: "clamp(36px, 5vw, 52px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.0, marginBottom: "16px" }}
          >
            {titleLine1}<br />
            <span style={{ fontStyle: "italic", color: C.red }}>{titleLine2}</span>
          </h2>
          <p style={{ fontSize: "14px", color: C.secondary, marginBottom: "4px" }}>{success.confirmed}</p>
          <p style={{ fontSize: "13px", color: C.muted, marginBottom: "40px" }}>
            {success.emailSent ? success.emailSent(form.email) : form.email}
          </p>

          {/* Booking details card */}
          <div
            className="text-left mb-8 w-full"
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}
          >
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: "16px" }}>
              {success.detailsTitle}
            </div>
            <div className="space-y-3">
              <SummaryRow icon={<Scissors size={13} />} label={serviceName} value={`₺${booking.service?.price?.toLocaleString()}`} />
              <SummaryRow icon={<User size={13} />} label={barberName} />
              <SummaryRow icon={<Calendar size={13} />} label={booking.date ? format(booking.date, "EEEE, d MMMM yyyy", { locale }) : ""} />
              <SummaryRow icon={<Clock size={13} />} label={booking.time} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center transition-all duration-200"
              style={{
                border: `1px solid ${C.border}`,
                color: C.secondary,
                padding: "13px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = C.primary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
            >
              {success.backHome}
            </Link>
            <Link
              href="/book"
              className="flex-1 flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: C.red,
                color: "#fff",
                padding: "13px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#E02020"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.red; }}
            >
              {success.bookAgain}
              <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2.5 mb-4">
          <div style={{ width: "20px", height: "2px", background: C.red, borderRadius: "1px" }} />
          <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.red, fontWeight: 500 }}>
            {s4.eyebrow}
          </span>
        </div>
        <h1
          className="font-display font-light"
          style={{ fontSize: "clamp(32px, 4.5vw, 48px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "10px" }}
        >
          {s4.title?.[0]}{" "}
          <span style={{ fontStyle: "italic", color: C.red }}>{s4.title?.[1]}</span>
        </h1>
        <p style={{ fontSize: "14px", color: C.secondary, lineHeight: 1.6 }}>{s4.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Booking summary sidebar */}
        <div className="lg:col-span-2">
          <div
            className="sticky top-24"
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}
          >
            <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: C.muted, marginBottom: "20px" }}>
              {s4.summaryTitle}
            </div>

            <div className="space-y-4 pb-5 mb-5" style={{ borderBottom: `1px solid ${C.border}` }}>
              <SummaryRow icon={<Scissors size={13} />} label={s4.labels?.service} value={serviceName} />
              <SummaryRow icon={<User size={13} />} label={s4.labels?.barber} value={barberName} />
              <SummaryRow icon={<Clock size={13} />} label={s4.labels?.duration} value={`${booking.service?.duration} ${success.duration ?? "dk"}`} />
              <SummaryRow icon={<Calendar size={13} />} label={s4.labels?.date} value={booking.date ? format(booking.date, "d MMM yyyy", { locale }) : ""} />
              <SummaryRow icon={<Clock size={13} />} label={s4.labels?.time} value={booking.time} />
            </div>

            <div className="flex items-center justify-between">
              <span style={{ fontSize: "12px", color: C.secondary }}>{s4.labels?.total}</span>
              <span className="font-display font-light" style={{ fontSize: "28px", color: C.primary, letterSpacing: "-0.02em" }}>
                ₺{booking.service?.price?.toLocaleString()}
              </span>
            </div>

            <p style={{ fontSize: "11px", color: C.muted, marginTop: "12px", lineHeight: 1.6 }}>{s4.disclaimer}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label={s4.formLabels?.name}
              placeholder={s4.placeholders?.name}
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
            <FormField
              label={s4.formLabels?.phone}
              placeholder={s4.placeholders?.phone}
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
              icon={<Phone size={13} />}
              required
            />
          </div>

          <FormField
            label={s4.formLabels?.email}
            placeholder={s4.placeholders?.email}
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            type="email"
            icon={<Mail size={13} />}
            required
          />

          <div>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: "8px", fontWeight: 500 }}>
              {s4.formLabels?.notes}
            </label>
            <textarea
              placeholder={s4.placeholders?.notes}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              style={{
                width: "100%",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.primary,
                fontSize: "14px",
                padding: "12px 14px",
                resize: "none",
                outline: "none",
                transition: "border-color 0.15s",
                lineHeight: 1.6,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(204,26,26,0.5)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 transition-all duration-200"
            style={{
              background: loading ? C.surface : C.red,
              color: loading ? C.secondary : "#fff",
              padding: "16px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#E02020"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = C.red; }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                {s4.confirming}
              </>
            ) : (
              <>
                <Check size={15} />
                {s4.confirmBtn}
              </>
            )}
          </button>

          <p className="text-center" style={{ fontSize: "12px", color: C.muted }}>{s4.disclaimer}</p>
        </form>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span style={{ color: C.red, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: "13px", color: C.secondary, flexShrink: 0 }}>{label}</span>
      {value && <span style={{ fontSize: "13px", color: C.primary, marginLeft: "auto", textAlign: "right" }}>{value}</span>}
    </div>
  );
}

function FormField({ label, placeholder, value, onChange, type = "text", icon, required }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, marginBottom: "8px", fontWeight: 500 }}>
        {label}{required && <span style={{ color: C.red, marginLeft: "2px" }}>*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            color: C.primary,
            fontSize: "14px",
            padding: icon ? "11px 14px 11px 36px" : "11px 14px",
            outline: "none",
            transition: "border-color 0.15s",
            height: "44px",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(204,26,26,0.5)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
        />
      </div>
    </div>
  );
}
