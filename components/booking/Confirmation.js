"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Calendar, Clock, User, Scissors, Phone, Mail, ArrowRight, CalendarPlus, Download } from "lucide-react";
import { googleCalendarUrl } from "@/lib/calendar";
import { useShop } from "@/contexts/ShopContext";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { tr as dateFnsTr, enUS } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatPhoneTRDisplay, toLocal10 } from "@/lib/validation";

function validateForm(form, isAuthenticated) {
  const errors = {};
  if (!isAuthenticated) {
    if (!form.name.trim() || form.name.trim().length < 2)
      errors.name = "En az 2 karakter olmalı";
    if (!toLocal10(form.phone))
      errors.phone = "Geçerli bir cep telefonu girin.";
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Geçerli bir e-posta adresi girin";
  return errors;
}

export default function Confirmation({ shopId, booking, onBack, onLoadingChange, onSuccess, lang = "tr", tx, compact = false }) {
  const shop = useShop();
  const shopSlug = shop?.slug;
  const { user } = useAuth();
  const isAuthenticated = !!(user && user.role === "CUSTOMER");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [createdApptId, setCreatedApptId] = useState(null);
  const [apptShop, setApptShop] = useState(null);

  const setLoadingState = (v) => { setLoading(v); onLoadingChange?.(v); };
  const [form, setForm] = useState({
    name:  isAuthenticated ? (user.displayName || "") : "",
    phone: isAuthenticated ? (user.phone || "") : "",
    email: isAuthenticated ? (user.email || "") : "",
    notes: "",
  });
  const s4 = tx?.booking?.step4 ?? {};
  const success = tx?.booking?.success ?? {};
  const locale = lang === "tr" ? dateFnsTr : enUS;

  const handlePhoneChange = (raw) => {
    setForm(f => ({ ...f, phone: formatPhoneTRDisplay(raw) }));
  };

  const handleBlur = (field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validateForm({ ...form }, isAuthenticated));
  };

  const submittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Synchronous guard — blocks rapid double-clicks before React re-renders the disabled button.
    if (submittingRef.current) return;
    const errs = validateForm(form, isAuthenticated);
    setErrors(errs);
    setTouched({ name: true, phone: true, email: true });
    if (Object.keys(errs).length > 0) {
      toast.error("Lütfen formdaki hataları düzeltin");
      return;
    }
    if (!isAuthenticated && (!form.name || !form.phone)) {
      toast.error(s4.errorMsg ?? "Lütfen tüm zorunlu alanları doldurun");
      return;
    }
    // "any" must be resolved to a real barber by TimeSelect/DateTimeSelect before this point.
    // If it isn't, the API rejects null with a confusing error — surface a clear one instead.
    const resolvedBarberId = booking.barber?.id;
    if (!resolvedBarberId || resolvedBarberId === "any") {
      toast.error("Berber seçiminde bir sorun oluştu. Lütfen saati yeniden seçin.");
      return;
    }
    submittingRef.current = true;
    setLoadingState(true);
    try {
      const dateStr = booking.date instanceof Date
        ? format(booking.date, "yyyy-MM-dd")
        : booking.date;

      const created = await apiFetch("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          shopId,
          name:      form.name,
          phone:     toLocal10(form.phone),
          email:     form.email,
          notes:     form.notes,
          serviceId: booking.service?.id,
          barberId:  resolvedBarberId,
          date:      dateStr,
          time:      booking.time,
          source:    "ONLINE",
        }),
      });
      setCreatedApptId(created?.id ?? null);
      setApptShop(created?.shop ?? null);
      setSubmitted(true);
      onSuccess?.();
      toast.success(success.confirmed ?? "Randevunuz onaylandı!");
    } catch (err) {
      toast.error(err.message ?? "Randevu oluşturulamadı. Bağlantınızı kontrol edip tekrar deneyin.");
      submittingRef.current = false;
    } finally {
      setLoadingState(false);
    }
    // On success we intentionally keep submittingRef true — view switches to Confirmation success screen,
    // so re-submit is impossible. Leaving it locked prevents any edge-case race.
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

    const dateStr = booking.date instanceof Date
      ? format(booking.date, "yyyy-MM-dd")
      : booking.date ?? "";

    const shopName    = apptShop?.name    ?? shop?.name    ?? "Makas Kuaför";
    const shopAddress = apptShop?.address ?? shop?.address ?? "";
    const shopPhone   = apptShop?.phone   ?? shop?.phone   ?? "";
    const locationStr = [shopName, shopAddress].filter(Boolean).join(", ");
    const descParts   = [
      `Hizmet: ${serviceName}`,
      `Berber: ${barberName}`,
      shopAddress && `Adres: ${shopAddress}`,
      shopPhone   && `Tel: ${shopPhone}`,
      form.notes  && `Not: ${form.notes}`,
    ].filter(Boolean);

    const gcalUrl = googleCalendarUrl({
      title:       `${serviceName}${barberName ? ` – ${barberName}` : ""}`,
      description: descParts.join("\n"),
      location:    locationStr,
      dateStr,
      timeStr:     booking.time ?? "09:00",
      durationMin: booking.service?.duration ?? 30,
    });

    const icsUrl = createdApptId ? `/api/calendar/${createdApptId}/ics` : null;

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
          className="flex items-center justify-center mb-8 bg-foreground text-background"
          style={{ width: "80px", height: "80px", borderRadius: "20px" }}
        >
          <Check size={36} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full"
        >
          <div className="text-foreground" style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px", fontWeight: 500 }}>
            {success.badge}
          </div>
          <h2
            className="font-display font-light text-foreground"
            style={{ fontSize: "clamp(36px, 5vw, 52px)", letterSpacing: "-0.02em", lineHeight: 1.0, marginBottom: "16px" }}
          >
            {titleLine1}<br />
            <span className="text-foreground" style={{ fontStyle: "italic" }}>{titleLine2}</span>
          </h2>
          <p className="text-secondary-foreground" style={{ fontSize: "14px", marginBottom: "4px" }}>{success.confirmed}</p>
          <p className="text-muted-foreground" style={{ fontSize: "13px", marginBottom: "32px" }}>
            {success.emailSent ? success.emailSent(form.email) : form.email}
          </p>

          {/* Booking details card */}
          <div
            className="text-left mb-6 w-full bg-card border-border"
            style={{ borderWidth: "1px", borderStyle: "solid", borderRadius: "12px", padding: "24px" }}
          >
            <div className="text-muted-foreground" style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "16px" }}>
              {success.detailsTitle}
            </div>
            <div className="space-y-3">
              <SummaryRow icon={<Scissors size={13} />} label={serviceName} value={booking.service?.price == null ? "Sorulur" : `₺${booking.service.price.toLocaleString()}`} />
              <SummaryRow icon={<User size={13} />} label={barberName} />
              <SummaryRow icon={<Calendar size={13} />} label={booking.date ? format(booking.date, "EEEE, d MMMM yyyy", { locale }) : ""} />
              <SummaryRow icon={<Clock size={13} />} label={booking.time} />
            </div>
          </div>

          {/* Add to Calendar */}
          <div
            className="w-full mb-6 bg-secondary border-border"
            style={{ borderWidth: "1px", borderStyle: "solid", borderRadius: "12px", padding: "20px" }}
          >
            <div className="text-muted-foreground" style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "14px", fontWeight: 500 }}>
              Takvime Ekle
            </div>
            <div className="flex flex-col gap-2.5">
              <a
                href={gcalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-all duration-150 bg-card border-border text-foreground"
                style={{ borderWidth: "1px", borderStyle: "solid", borderRadius: "8px", padding: "11px 16px", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(17,17,17,0.25)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--makas-border)"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill="#4285F4"/>
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" fill="white" fillOpacity="0.3"/>
                  <path d="M15.5 8.5h-7v7h7v-7zm-1 6h-5v-5h5v5z" fill="white"/>
                  <path d="M17 6H7v2h10V6zm0 10H7v2h10v-2z" fill="#34A853"/>
                  <path d="M6 7H4v10h2V7z" fill="#FBBC05"/>
                  <path d="M20 7h-2v10h2V7z" fill="#EA4335"/>
                </svg>
                Google Calendar
                <ArrowRight size={12} style={{ marginLeft: "auto", opacity: 0.4 }} />
              </a>

              {icsUrl && (
                <a
                  href={icsUrl}
                  download
                  className="flex items-center gap-3 transition-all duration-150 bg-card border-border text-foreground"
                  style={{ borderWidth: "1px", borderStyle: "solid", borderRadius: "8px", padding: "11px 16px", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(17,17,17,0.25)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--makas-border)"}
                >
                  <Download size={15} className="text-muted-foreground" />
                  Apple / Outlook Takvimi
                  <span className="text-muted-foreground" style={{ marginLeft: "auto", fontSize: "11px" }}>(.ics)</span>
                </a>
              )}
            </div>
            <p style={{ fontSize: "11px", color: "#C5BEB5", marginTop: "12px", lineHeight: 1.5 }}>
              48 saat ve 3 saat öncesi için otomatik hatırlatıcı eklenir.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href={shopSlug ? `/${shopSlug}` : "/"}
              className="flex-1 flex items-center justify-center transition-all duration-200 border-border text-secondary-foreground"
              style={{
                borderWidth: "1px", borderStyle: "solid",
                padding: "13px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--makas-ink)"; e.currentTarget.style.color = "var(--makas-ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--makas-border)"; e.currentTarget.style.color = "var(--makas-ink-secondary)"; }}
            >
              {success.backHome}
            </Link>
            <Link
              href={shopSlug ? `/${shopSlug}/book` : "/book"}
              className="flex-1 flex items-center justify-center gap-2 transition-all duration-200 bg-foreground text-background"
              style={{
                padding: "13px 20px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
              }}
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
      {/* Header — hidden in compact (mobile) mode */}
      {!compact && (
        <div className="mb-10">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="bg-foreground" style={{ width: "20px", height: "2px", borderRadius: "1px" }} />
            <span className="text-foreground" style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500 }}>
              {s4.eyebrow}
            </span>
          </div>
          <h1
            className="font-display font-light text-foreground"
            style={{ fontSize: "clamp(32px, 4.5vw, 48px)", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: "10px" }}
          >
            {s4.title?.[0]}{" "}
            <span className="text-foreground" style={{ fontStyle: "italic" }}>{s4.title?.[1]}</span>
          </h1>
          <p className="text-secondary-foreground" style={{ fontSize: "14px", lineHeight: 1.6 }}>{s4.subtitle}</p>
        </div>
      )}

      {/* Mobile-only compact booking summary */}
      <div
        className="lg:hidden mb-5 flex items-center justify-between gap-4 bg-card border-border"
        style={{ borderWidth: "1px", borderStyle: "solid", borderRadius: "12px", padding: "16px 20px" }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="text-foreground" style={{ fontSize: "14px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {serviceName}
          </div>
          <div className="text-muted-foreground" style={{ fontSize: "12px", marginTop: "2px" }}>
            {barberName && `${barberName} · `}
            {booking.date ? format(booking.date, "d MMM", { locale }) : ""}
            {booking.time ? ` · ${booking.time}` : ""}
          </div>
        </div>
        <span className="font-display font-light shrink-0 text-foreground" style={{ fontSize: "24px", letterSpacing: "-0.02em" }}>
          {booking.service?.price == null ? "Sorulur" : `₺${booking.service.price.toLocaleString()}`}
        </span>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Booking summary sidebar — desktop only */}
        <div className="hidden lg:block lg:col-span-2">
          <div
            className="sticky top-24 bg-card border-border"
            style={{ borderWidth: "1px", borderStyle: "solid", borderRadius: "12px", padding: "24px" }}
          >
            <div className="text-muted-foreground" style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
              {s4.summaryTitle}
            </div>

            <div className="space-y-4 pb-5 mb-5 border-b border-border">
              <SummaryRow icon={<Scissors size={13} />} label={s4.labels?.service} value={serviceName} />
              <SummaryRow icon={<User size={13} />} label={s4.labels?.barber} value={barberName} />
              <SummaryRow icon={<Clock size={13} />} label={s4.labels?.duration} value={`${booking.service?.duration} ${success.duration ?? "dk"}`} />
              <SummaryRow icon={<Calendar size={13} />} label={s4.labels?.date} value={booking.date ? format(booking.date, "d MMM yyyy", { locale }) : ""} />
              <SummaryRow icon={<Clock size={13} />} label={s4.labels?.time} value={booking.time} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary-foreground" style={{ fontSize: "12px" }}>{s4.labels?.total}</span>
              <span className="font-display font-light text-foreground" style={{ fontSize: "28px", letterSpacing: "-0.02em" }}>
                {booking.service?.price == null ? "Sorulur" : `₺${booking.service.price.toLocaleString()}`}
              </span>
            </div>

            <p className="text-muted-foreground" style={{ fontSize: "11px", marginTop: "12px", lineHeight: 1.6 }}>{s4.disclaimer}</p>
          </div>
        </div>

        {/* Form */}
        <form id="booking-confirm-form" onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          {isAuthenticated ? (
            /* Logged-in: show read-only identity block — no re-entry needed */
            <div className="rounded-[10px] border border-border bg-secondary/40 px-4 py-3 flex items-center gap-3">
              <User size={15} className="text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground">{form.name}</p>
                <p className="text-[12px] text-muted-foreground">{form.phone}{form.email ? ` · ${form.email}` : ""}</p>
              </div>
            </div>
          ) : (
            /* Guest: collect name + phone */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label={s4.formLabels?.name ?? "Ad Soyad"}
                  placeholder={s4.placeholders?.name ?? "Ahmet Yılmaz"}
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  onBlur={() => handleBlur("name")}
                  error={touched.name ? errors.name : undefined}
                  required
                />
                <FormField
                  label={s4.formLabels?.phone ?? "Telefon"}
                  placeholder="0532 123 45 67"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlur("phone")}
                  error={touched.phone ? errors.phone : undefined}
                  icon={<Phone size={13} />}
                  inputMode="tel"
                  autoComplete="tel"
                  type="tel"
                  required
                />
              </div>
              <FormField
                label={(s4.formLabels?.email ?? "E-posta") + " (isteğe bağlı)"}
                placeholder={s4.placeholders?.email ?? "ornek@mail.com"}
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                onBlur={() => handleBlur("email")}
                error={touched.email ? errors.email : undefined}
                type="email"
                icon={<Mail size={13} />}
              />
            </>
          )}

          <div>
            <label className="text-muted-foreground" style={{ display: "block", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px", fontWeight: 500 }}>
              {s4.formLabels?.notes}
            </label>
            <textarea
              placeholder={s4.placeholders?.notes}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="bg-card border-border text-foreground"
              style={{
                width: "100%",
                borderWidth: "1px",
                borderStyle: "solid",
                borderRadius: "8px",
                fontSize: "16px",
                padding: "12px 14px",
                resize: "none",
                outline: "none",
                transition: "border-color 0.15s",
                lineHeight: 1.6,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(17,17,17,0.5)";
                setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
              }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--makas-border)"; }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hidden md:flex w-full items-center justify-center gap-2.5 transition-all duration-200"
            style={{
              background: loading ? "var(--makas-surface2)" : "var(--makas-ink)",
              color: loading ? "var(--makas-ink-secondary)" : "var(--makas-bg)",
              padding: "16px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.01em",
            }}
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

          <p className="text-center text-muted-foreground" style={{ fontSize: "12px" }}>{s4.disclaimer}</p>
        </form>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-foreground" style={{ flexShrink: 0 }}>{icon}</span>
      <span className="text-secondary-foreground" style={{ fontSize: "13px", flexShrink: 0 }}>{label}</span>
      {value && <span className="text-foreground" style={{ fontSize: "13px", marginLeft: "auto", textAlign: "right" }}>{value}</span>}
    </div>
  );
}

function FormField({ label, placeholder, value, onChange, onBlur, type = "text", icon, required, error, inputMode, autoComplete }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: error ? "var(--makas-ink)" : "var(--makas-ink-muted)", marginBottom: "8px", fontWeight: 500 }}>
        {label}{required && <span className="text-foreground" style={{ marginLeft: "2px" }}>*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: error ? "var(--makas-ink)" : "var(--makas-ink-muted)" }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="bg-card text-foreground"
          style={{
            width: "100%",
            border: `1px solid ${error ? "var(--makas-ink)" : "var(--makas-border)"}`,
            borderRadius: "8px",
            fontSize: "16px",
            padding: icon ? "11px 14px 11px 36px" : "11px 14px",
            outline: "none",
            transition: "border-color 0.15s",
            height: "44px",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--makas-ink)" : "rgba(17,17,17,0.5)";
            setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
          }}
          onBlur={(e) => { e.currentTarget.style.borderColor = error ? "var(--makas-ink)" : "var(--makas-border)"; onBlur?.(); }}
        />
      </div>
      {error && (
        <p className="text-foreground" style={{ fontSize: "11px", marginTop: "5px" }}>{error}</p>
      )}
    </div>
  );
}
