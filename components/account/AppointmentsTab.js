"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Star, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { STATUS, Sk, EmptyState, StarPicker, ease } from "./shared";

// ── ReviewModal ───────────────────────────────────────────────────────────────

function ReviewModal({ appt, onClose, onDone }) {
  const [barberRating, setBarberRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleUrl, setGoogleUrl] = useState(null);

  async function submit() {
    if (!barberRating) { toast.error("Lütfen bir puan verin"); return; }
    setLoading(true);
    const res = await fetch("/api/customer/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: appt.id, barberRating, comment }),
    });
    setLoading(false);
    if (res.ok) {
      const d = await res.json();
      if (d.googleReviewUrl) { setGoogleUrl(d.googleReviewUrl); }
      else { toast.success("Değerlendirme gönderildi!"); onDone(appt.id); }
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "Gönderilemedi");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(17,17,17,0.5)" }}
      onClick={!googleUrl ? onClose : undefined}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.22, ease }}
        className="w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl"
        style={{ background: "var(--makas-surface)" }}
        onClick={e => e.stopPropagation()}>
        {googleUrl ? (
          <>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
                <Check size={26} className="text-emerald-600" />
              </div>
              <p className="font-display font-semibold text-[22px]">Teşekkürler!</p>
              <p className="text-[13px] text-muted-foreground">Google&apos;da da paylaşmak ister misiniz?</p>
            </div>
            <a href={googleUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => onDone(appt.id)}
              className="flex w-full h-11 items-center justify-center rounded-full bg-foreground text-background text-[14px] font-semibold no-underline hover:opacity-90 transition-opacity">
              Google&apos;da Değerlendir
            </a>
            <button onClick={() => onDone(appt.id)} className="w-full text-[13px] text-muted-foreground hover:text-foreground transition-colors">
              Hayır, teşekkürler
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-[20px]">Değerlendirme</h3>
                <p className="text-[13px] text-muted-foreground">{appt.barber?.nameTr || appt.shop?.name}</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
            <StarPicker value={barberRating} onChange={setBarberRating} size={30} />
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Yorumunuz (isteğe bağlı)" rows={3}
              className="w-full rounded-[12px] border border-border bg-background px-4 py-3 text-[14px] resize-none outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow" />
            <button onClick={submit} disabled={loading || !barberRating}
              className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              Gönder
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── AppointmentsTab ───────────────────────────────────────────────────────────

export default function AppointmentsTab({ type, appointments, setAppointments }) {
  const [reviewing, setReviewing] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = (appointments ?? []).filter(a => {
    if (type === "upcoming") return ["PENDING", "CONFIRMED"].includes(a.status) && a.date >= today;
    return ["COMPLETED", "CANCELLED", "NOSHOW"].includes(a.status) || a.date < today;
  });
  const sorted = [...filtered].sort((a, b) =>
    type === "upcoming" ? (a.date < b.date ? -1 : 1) : (a.date > b.date ? -1 : 1)
  );

  async function cancelAppt(id) {
    if (!confirm("Randevuyu iptal etmek istiyor musunuz?")) return;
    const res = await fetch(`/api/customer/appointments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "CANCELLED" } : a));
      toast.success("Randevu iptal edildi");
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error || "İptal edilemedi");
    }
  }

  if (appointments === null) {
    return (
      <div className="space-y-3">
        <Sk className="h-6 w-40 mb-5" />
        {[1,2,3].map(i => (
          <div key={i} className="flex gap-4 rounded-[16px] border border-border bg-card p-5 animate-pulse">
            <Sk className="w-14 h-14 rounded-[12px] shrink-0" />
            <div className="flex-1 space-y-2.5">
              <Sk className="h-4 w-44" />
              <Sk className="h-3 w-32" />
              <Sk className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={type === "upcoming" ? Calendar : Clock}
        title={type === "upcoming" ? "Yaklaşan randevunuz yok" : "Geçmiş randevu bulunamadı"}
        sub={type === "upcoming" ? "Favori salonlarınızdan kolayca randevu alın." : "Daha önce hiç randevu almadınız."}
        action={type === "upcoming"
          ? <Link href="/salons" className="inline-flex h-11 items-center px-6 rounded-full bg-foreground text-background text-[13px] font-semibold no-underline hover:opacity-90 transition-opacity">Salon Keşfet</Link>
          : null}
      />
    );
  }

  return (
    <div>
      {reviewing && (
        <AnimatePresence>
          <ReviewModal
            appt={reviewing}
            onClose={() => setReviewing(null)}
            onDone={(id) => {
              setAppointments(prev => prev.map(a => a.id === id ? { ...a, reviewed: true } : a));
              setReviewing(null);
            }}
          />
        </AnimatePresence>
      )}

      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-[22px] tracking-tight text-foreground">
          {type === "upcoming" ? "Yaklaşan Randevular" : "Geçmiş Randevular"}
        </h2>
        <span className="text-[13px] text-muted-foreground">{sorted.length} randevu</span>
      </div>

      <div className="space-y-3">
        {sorted.map((appt, i) => {
          const st = STATUS[appt.status] ?? STATUS.PENDING;
          const d = new Date(appt.date);
          const dayBg = appt.status === "COMPLETED" ? "var(--makas-ink)"
            : appt.status === "CANCELLED" ? "#9ca3af"
            : appt.status === "NOSHOW"    ? "#ef4444"
            : "#3b82f6";

          return (
            <motion.div key={appt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: Math.min(i * 0.04, 0.3), ease }}>
              <div className="flex gap-4 rounded-[16px] border border-border bg-card p-4 sm:p-5 transition-shadow hover:shadow-md"
                style={{ boxShadow: "var(--shadow-card)" }}>

                {/* Date block */}
                <div className="shrink-0 w-14 h-14 rounded-[12px] flex flex-col items-center justify-center"
                  style={{ background: dayBg }}>
                  <span className="text-[21px] font-bold text-white leading-none">{d.getDate()}</span>
                  <span className="text-[9px] font-bold text-white/75 uppercase tracking-wider mt-0.5">
                    {d.toLocaleDateString("tr-TR", { month: "short" }).replace(".", "").toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-[15px] text-foreground leading-snug truncate">{appt.shop?.name}</p>
                      <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                        {[appt.barber?.nameTr, appt.service?.nameTr].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                      style={{ background: st.bg, color: st.color, borderColor: st.border }}>
                      {st.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={11} />{appt.time} · {appt.duration} dk</span>
                    {appt.price != null && <span className="font-semibold text-foreground">{Number(appt.price).toLocaleString("tr-TR")} ₺</span>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {["PENDING", "CONFIRMED"].includes(appt.status) && appt.date >= today && (
                      <button onClick={() => cancelAppt(appt.id)}
                        className="text-[12px] font-medium text-red-600 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50 transition-colors">
                        İptal Et
                      </button>
                    )}
                    {appt.status === "COMPLETED" && !appt.reviewed && (
                      <button onClick={() => setReviewing(appt)}
                        className="flex items-center gap-1 text-[12px] font-medium border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition-colors">
                        <Star size={11} /> Değerlendir
                      </button>
                    )}
                    {appt.status === "COMPLETED" && appt.reviewed && (
                      <span className="text-[12px] text-emerald-600 flex items-center gap-1">
                        <Check size={11} /> Değerlendirildi
                      </span>
                    )}
                    {appt.shop?.slug && (
                      <Link href={`/${appt.shop.slug}`}
                        className="ml-auto text-[12px] font-semibold rounded-full bg-foreground text-background px-3 py-1.5 no-underline hover:opacity-90 transition-opacity">
                        Tekrar Al
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
