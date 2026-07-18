"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Heart, User, Settings, LogOut,
  Star, MapPin, Phone, X, Check, Loader2,
  MessageSquare, Pencil, Search, BadgeCheck, ExternalLink,
  ChevronDown, Trash2, Eye, EyeOff, Bell, BellOff,
  TrendingUp, Scissors, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/shared/Navbar";

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "upcoming",  label: "Yaklaşan",   Icon: Calendar },
  { id: "history",   label: "Geçmiş",     Icon: Clock },
  { id: "favorites", label: "Favoriler",  Icon: Heart },
  { id: "reviews",   label: "Yorumlarım", Icon: MessageSquare },
  { id: "profile",   label: "Profil",     Icon: User },
  { id: "settings",  label: "Ayarlar",    Icon: Settings },
];

const ease = [0.22, 1, 0.36, 1];

const pageVar = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

// ── Utilities ──────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS = {
  PENDING:   { bg: "#fffbeb", color: "#92400e", border: "#fde68a", label: "Bekliyor"    },
  CONFIRMED: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", label: "Onaylandı"  },
  COMPLETED: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", label: "Tamamlandı" },
  CANCELLED: { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb", label: "İptal"      },
  NOSHOW:    { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", label: "Gelmedi"    },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Sk({ className = "" }) {
  return <div className={`rounded-[8px] bg-secondary animate-pulse ${className}`} />;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-[20px] flex items-center justify-center mb-5"
        style={{ background: "var(--makas-surface2)", border: "1px solid var(--makas-border)" }}>
        <Icon size={30} className="text-muted-foreground/40" />
      </div>
      <p className="font-display font-semibold text-[22px] tracking-tight text-foreground">{title}</p>
      {sub && <p className="mt-2 text-[14px] text-muted-foreground max-w-xs leading-relaxed">{sub}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ── Field (form helper) ────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ on }) {
  return (
    <div className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${on ? "bg-foreground" : "bg-border"}`}>
      <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? "translate-x-5" : "translate-x-[3px]"}`} />
    </div>
  );
}

// ── StarPicker ────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange, size = 28 }) {
  return (
    <div className="flex gap-2">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className="transition-transform hover:scale-110 active:scale-95">
          <Star size={size} fill={i <= value ? "#f59e0b" : "none"} color={i <= value ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

function ReviewStars({ rating, size = 12 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} fill={i <= rating ? "#f59e0b" : "none"} color={i <= rating ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow({ stats }) {
  const totalSpentFmt = stats?.totalSpent > 0
    ? `₺${Number(stats.totalSpent).toLocaleString("tr-TR")}`
    : null;
  const items = [
    { label: "Yaklaşan",   value: stats?.upcoming,  Icon: Calendar,   color: "#3b82f6" },
    { label: "Tamamlanan", value: stats?.completed, Icon: Check,      color: "#10b981" },
    { label: "Harcama",    value: totalSpentFmt,    Icon: TrendingUp, color: "#8b5cf6" },
    { label: "Favoriler",  value: stats?.favorites, Icon: Heart,      color: "#f43f5e" },
    { label: "Ort. Puan",  value: stats?.avgRating != null ? `${stats.avgRating}★` : null, Icon: Star, color: "#f59e0b" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {items.map(({ label, value, Icon, color }, idx) => (
        <div key={label} className={`flex flex-col gap-2 p-4 rounded-[14px] border border-border bg-card${idx === items.length - 1 && items.length % 2 !== 0 ? " col-span-2 sm:col-span-1" : ""}`}
          style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon size={13} style={{ color }} />
            </div>
          </div>
          {stats === null
            ? <Sk className="h-7 w-10" />
            : <span className="font-display font-semibold text-[26px] leading-none tracking-tight">{value ?? "—"}</span>
          }
        </div>
      ))}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function AccountSidebar({ tab, setTab, user, onLogout, stats }) {
  const initials = user.displayName
    ? user.displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "M";

  const memberYear = user.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <aside className="hidden md:flex flex-col shrink-0 sticky top-[88px] h-[calc(100dvh-88px)] overflow-y-auto"
      style={{ width: 280, borderRight: "1px solid var(--makas-border)", background: "var(--makas-surface)" }}>

      {/* Profile card */}
      <div className="p-6 border-b border-border">
        <div className="w-[60px] h-[60px] rounded-[14px] flex items-center justify-center mb-4"
          style={{ background: "var(--makas-ink)" }}>
          <span className="font-display font-light text-[24px] text-[var(--makas-bg)]">{initials}</span>
        </div>
        <h2 className="font-display font-semibold text-[19px] tracking-tight text-foreground leading-tight truncate">
          {user.displayName || "Müşteri"}
        </h2>
        <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{user.email}</p>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: "var(--makas-surface2)", color: "var(--makas-ink-secondary)", border: "1px solid var(--makas-border)" }}>
            <User size={10} /> Müşteri
          </span>
          {memberYear && (
            <span className="text-[11px] text-muted-foreground">Üye {memberYear}</span>
          )}
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Randevu", value: stats?.completed },
            { label: "Favori",  value: stats?.favorites },
            { label: "Yorum",   value: stats?.reviews   },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-2 rounded-[10px]" style={{ background: "var(--makas-surface2)" }}>
              {stats === null
                ? <Sk className="h-5 w-6 mx-auto mb-0.5" />
                : <p className="font-display font-semibold text-[17px] leading-none">{value ?? "—"}</p>
              }
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Menü</p>
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <SidebarItem key={id} id={id} label={label} Icon={Icon} active={active} onClick={() => setTab(id)}
              badge={id === "upcoming" && stats?.upcoming > 0 ? stats.upcoming : null} />
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors text-red-500 hover:bg-red-50">
          <LogOut size={14} />
          <span className="text-[13px] font-medium">Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ label, Icon, active, onClick, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all duration-150 mb-0.5"
      style={{
        background: active ? "var(--makas-ink)" : hov ? "var(--makas-surface2)" : "transparent",
        color: active ? "#fff" : hov ? "var(--makas-ink)" : "var(--makas-ink-secondary)",
      }}>
      <Icon size={15} />
      <span className="text-[13px] font-medium flex-1">{label}</span>
      {badge != null && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
          style={{ background: active ? "rgba(255,255,255,0.2)" : "var(--makas-ink)", color: "var(--makas-bg)" }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Mobile bottom nav ─────────────────────────────────────────────────────────

function MobileBottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(247,244,238,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid var(--makas-border)",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
      }}>
      <div className="flex items-stretch h-14">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
              style={{ color: active ? "var(--makas-ink)" : "var(--makas-ink-muted)" }}>
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ── Review modal ──────────────────────────────────────────────────────────────

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

// ── Appointments tab ──────────────────────────────────────────────────────────

function AppointmentsTab({ type, appointments, setAppointments }) {
  const [reviewing, setReviewing] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = (appointments ?? []).filter(a => {
    if (type === "upcoming") return ["PENDING", "CONFIRMED"].includes(a.status) && a.date >= today;
    return ["COMPLETED", "CANCELLED", "NOSHOW"].includes(a.status) || a.date < today;
  });
  const sorted = [...filtered].sort((a, b) =>
    type === "upcoming" ? (a.date < b.date ? -1 : 1) : (a.date > b.date ? -1 : 1)
  );

  // For history tab: split into completed vs cancelled/noshow
  const completedAppts  = type === "history" ? sorted.filter(a => a.status === "COMPLETED") : null;
  const cancelledAppts  = type === "history" ? sorted.filter(a => ["CANCELLED", "NOSHOW"].includes(a.status)) : null;

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

  function renderCard(appt, i) {
    const st = STATUS[appt.status] ?? STATUS.PENDING;
    const d = new Date(appt.date);
    const dayBg = appt.status === "COMPLETED" ? "#1a1a1a"
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
          <div className="shrink-0 w-14 h-14 rounded-[12px] flex flex-col items-center justify-center"
            style={{ background: dayBg }}>
            <span className="text-[21px] font-bold text-white leading-none">{d.getDate()}</span>
            <span className="text-[9px] font-bold text-white/75 uppercase tracking-wider mt-0.5">
              {d.toLocaleDateString("tr-TR", { month: "short" }).replace(".", "").toUpperCase()}
            </span>
          </div>
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

      {type === "history" ? (
        <div className="space-y-8">
          {/* Completed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-[20px] tracking-tight text-foreground">Tamamlanan</h2>
              <span className="text-[13px] text-muted-foreground">{completedAppts.length} randevu</span>
            </div>
            {completedAppts.length === 0
              ? <p className="text-[13px] text-muted-foreground py-4">Tamamlanmış randevu bulunamadı.</p>
              : <div className="space-y-3">{completedAppts.map((a, i) => renderCard(a, i))}</div>
            }
          </div>
          {/* Cancelled / No-show */}
          {cancelledAppts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-[20px] tracking-tight text-muted-foreground">İptal & Gelmedi</h2>
                <span className="text-[13px] text-muted-foreground">{cancelledAppts.length} randevu</span>
              </div>
              <div className="space-y-3">{cancelledAppts.map((a, i) => renderCard(a, i))}</div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-[22px] tracking-tight text-foreground">Yaklaşan Randevular</h2>
            <span className="text-[13px] text-muted-foreground">{sorted.length} randevu</span>
          </div>
          <div className="space-y-3">
            {sorted.map((appt, i) => renderCard(appt, i))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Favorites tab ─────────────────────────────────────────────────────────────

function FavoritesTab() {
  const [favs, setFavs] = useState(null);

  useEffect(() => {
    fetch("/api/customer/favorites")
      .then(r => r.json())
      .then(d => setFavs(Array.isArray(d) ? d : []))
      .catch(() => setFavs([]));
  }, []);

  async function remove(shopId) {
    const res = await fetch(`/api/customer/favorites/${shopId}`, { method: "DELETE" });
    if (res.ok) { setFavs(prev => prev.filter(f => f.shopId !== shopId)); toast.success("Favorilerden kaldırıldı"); }
    else toast.error("Kaldırılamadı");
  }

  if (favs === null) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-[16px] border border-border bg-card overflow-hidden animate-pulse">
            <Sk className="h-36 rounded-none" />
            <div className="p-4 space-y-2">
              <Sk className="h-4 w-36" />
              <Sk className="h-3 w-24" />
              <Sk className="h-9 w-full rounded-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favs.length === 0) {
    return (
      <EmptyState icon={Heart} title="Favori salonunuz yok"
        sub="Beğendiğiniz salonları favorilere ekleyerek hızla bulun."
        action={<Link href="/salons" className="inline-flex h-11 items-center px-6 rounded-full bg-foreground text-background text-[13px] font-semibold no-underline hover:opacity-90 transition-opacity">Keşfet</Link>}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-[22px] tracking-tight text-foreground">Favori Salonlar</h2>
        <span className="text-[13px] text-muted-foreground">{favs.length} salon</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {favs.map(({ shopId, shop }, i) => (
          <motion.div key={shopId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, delay: Math.min(i * 0.05, 0.3), ease }}>
            <FavSalonCard shopId={shopId} shop={shop} onRemove={remove} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FavSalonCard({ shopId, shop, onRemove }) {
  return (
    <div className="group rounded-[16px] border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
      style={{ boxShadow: "var(--shadow-card)" }}>
      {/* Cover */}
      <div className="relative h-36 bg-secondary overflow-hidden">
        {shop?.coverImage
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full flex items-center justify-center"><Scissors size={24} className="text-muted-foreground/25" /></div>
        }
        <button onClick={() => onRemove(shopId)}
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "rgba(17,17,17,0.65)" }}>
          <X size={13} className="text-white" />
        </button>
        {shop?.logo && (
          <div className="absolute bottom-2 left-3 w-9 h-9 rounded-[8px] border-2 border-white overflow-hidden bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shop.logo} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-[15px] text-foreground leading-snug line-clamp-1">{shop?.name}</p>
        {shop?.googleRating != null && (
          <div className="flex items-center gap-1.5 mt-1">
            <Star size={11} fill="#f59e0b" color="#f59e0b" strokeWidth={0} />
            <span className="text-[13px] font-semibold">{Number(shop.googleRating).toFixed(1)}</span>
            {shop?.googleTotalRatings && <span className="text-[12px] text-muted-foreground">({shop.googleTotalRatings})</span>}
          </div>
        )}
        {(shop?.addressLine || shop?.city) && (
          <p className="flex items-center gap-1 mt-1.5 text-[12px] text-muted-foreground line-clamp-1">
            <MapPin size={10} className="shrink-0" />
            {[shop.addressLine, shop.city].filter(Boolean).join(", ")}
          </p>
        )}
        <div className="flex items-center gap-2 mt-3">
          {shop?.slug && (
            <Link href={`/${shop.slug}`}
              className="flex-1 h-9 rounded-full bg-foreground text-background text-[13px] font-semibold flex items-center justify-center no-underline hover:opacity-90 transition-opacity">
              Randevu Al
            </Link>
          )}
          {shop?.phone && (
            <a href={`tel:${shop.phone}`}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors no-underline">
              <Phone size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── My Reviews tab ────────────────────────────────────────────────────────────

const SORT_OPTS = [
  { value: "newest",  label: "En Yeni" },
  { value: "oldest",  label: "En Eski" },
  { value: "highest", label: "En Yüksek" },
  { value: "lowest",  label: "En Düşük" },
];

function MyReviewsTab({ onSwitchTab }) {
  const [reviews, setReviews]   = useState(null);
  const [editing, setEditing]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const [starFilter, setStarFilter] = useState(0);
  const [sort, setSort]         = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    fetch("/api/customer/reviews")
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d) ? d : []))
      .catch(() => setReviews([]));
  }, []);

  async function saveEdit() {
    if (!editing || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customer/reviews/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barberRating: editing.barberRating, comment: editing.comment }),
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === editing.id ? { ...r, ...editing } : r));
        setEditing(null);
        toast.success("Yorum güncellendi");
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Güncellenemedi");
      }
    } finally { setSaving(false); }
  }

  async function doDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customer/reviews/${deleteId}`, { method: "DELETE" });
      if (res.ok) { setReviews(prev => prev.filter(r => r.id !== deleteId)); setDeleteId(null); toast.success("Yorum silindi"); }
      else toast.error("Yorum silinemedi");
    } finally { setDeleting(false); }
  }

  const q = search.trim().toLowerCase();
  const filtered = (reviews ?? []).filter(r => {
    if (starFilter > 0 && r.barberRating !== starFilter) return false;
    if (!q) return true;
    return (
      r.barber?.nameTr?.toLowerCase().includes(q) ||
      r.shop?.name?.toLowerCase().includes(q) ||
      r.appointment?.service?.nameTr?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sort === "oldest")  return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "highest") return b.barberRating - a.barberRating;
    if (sort === "lowest")  return a.barberRating - b.barberRating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (reviews === null) {
    return (
      <div className="space-y-4">
        <Sk className="h-6 w-40 mb-5" />
        {[1,2].map(i => (
          <div key={i} className="rounded-[16px] border border-border bg-card p-4 animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <Sk className="w-11 h-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-4 w-32" />
                <Sk className="h-3 w-48" />
              </div>
            </div>
            <Sk className="h-3 w-28" />
            <Sk className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState icon={Star} title="Henüz yorum yazmadınız"
        sub="Tamamlanan randevularınızı değerlendirerek diğer müşterilere yardımcı olun."
        action={
          <button onClick={() => onSwitchTab?.("history")}
            className="inline-flex h-11 items-center px-6 rounded-full bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity">
            Geçmiş Randevularım
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display font-semibold text-[22px] tracking-tight text-foreground">Yorumlarım</h2>
        <span className="text-[13px] text-muted-foreground">{reviews.length} yorum</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input type="search" placeholder="Berber, salon veya hizmet ara…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-[10px] border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
          {[0,5,4,3,2,1].map(s => (
            <button key={s} onClick={() => setStarFilter(v => v === s ? 0 : s)}
              className="shrink-0 flex items-center gap-1 h-10 px-3 rounded-[10px] border text-[12px] font-medium transition-all"
              style={{
                borderColor: starFilter === s ? "var(--makas-ink)" : "var(--makas-border)",
                background:  starFilter === s ? "var(--makas-ink)" : "transparent",
                color:       starFilter === s ? "#fff" : "var(--makas-ink-secondary)",
              }}>
              {s === 0 ? "Tümü" : <><Star size={11} fill="#f59e0b" color="#f59e0b" strokeWidth={0} />{s}</>}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <button onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1.5 h-10 px-3 rounded-[10px] border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown size={12} style={{ transform: sortOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            {SORT_OPTS.find(o => o.value === sort)?.label}
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
                className="absolute right-0 top-full mt-1 bg-card border border-border rounded-[10px] shadow-lg z-20 py-1 min-w-[140px]"
                onMouseLeave={() => setSortOpen(false)}>
                {SORT_OPTS.map(o => (
                  <button key={o.value} onClick={() => { setSort(o.value); setSortOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-secondary/60 transition-colors flex items-center gap-2"
                    style={{ color: sort === o.value ? "var(--makas-ink)" : "var(--makas-ink-secondary)", fontWeight: sort === o.value ? 600 : 400 }}>
                    {sort === o.value && <Check size={12} />}
                    {o.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {(search || starFilter > 0) && (
        <p className="text-[12px] text-muted-foreground">{filtered.length} yorum bulundu</p>
      )}
      {filtered.length === 0 && (search || starFilter > 0) && (
        <EmptyState icon={Search} title="Sonuç bulunamadı" sub="Farklı bir filtre deneyin."
          action={<button onClick={() => { setSearch(""); setStarFilter(0); }}
            className="inline-flex h-10 items-center px-4 rounded-full border border-border text-[13px] font-medium hover:bg-secondary/60 transition-colors">
            Temizle
          </button>}
        />
      )}

      {/* Cards */}
      <div className="space-y-5">
        {filtered.map((r, i) => {
          const avatarSrc = r.barber?.profilePhoto ||
            (r.barber?.avatar && r.barber.avatar.length > 4 ? r.barber.avatar : null);
          const initial = (r.barber?.nameTr?.[0] || "B").toUpperCase();

          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, delay: Math.min(i * 0.05, 0.3), ease }}
              className="rounded-[20px] border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg"
              style={{ boxShadow: "var(--shadow-card)" }}>

              {/* Header */}
              <div className="p-5 pb-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="shrink-0 w-[52px] h-[52px] rounded-[14px] overflow-hidden border border-border flex items-center justify-center"
                    style={{ background: avatarSrc ? "transparent" : "var(--makas-surface2)" }}>
                    {avatarSrc
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarSrc} alt={r.barber?.nameTr || "Berber"} className="w-full h-full object-cover" />
                      : <span className="font-display font-semibold text-[20px] text-foreground">{initial}</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[15px] text-foreground leading-snug">{r.barber?.nameTr}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <BadgeCheck size={9} /> Doğrulanmış
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                          {r.shop?.name}
                          {r.appointment?.service?.nameTr && (
                            <span className="text-muted-foreground/60"> · {r.appointment.service.nameTr}</span>
                          )}
                        </p>
                      </div>
                      {/* Desktop actions */}
                      <div className="hidden sm:flex gap-1.5 shrink-0">
                        <button onClick={() => setEditing({ id: r.id, barberRating: r.barberRating, comment: r.comment || "" })}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors">
                          <Pencil size={11} /> Düzenle
                        </button>
                        <button onClick={() => setDeleteId(r.id)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-red-500 hover:text-red-700 border border-red-200 bg-red-50/50 rounded-full px-3 py-1.5 transition-colors">
                          <Trash2 size={11} /> Sil
                        </button>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-2 mt-3">
                      <ReviewStars rating={r.barberRating} size={14} />
                      <span className="text-[13px] font-bold text-foreground">{r.barberRating}.0</span>
                    </div>
                  </div>
                </div>

                {/* Comment */}
                {r.comment && (
                  <p className="mt-3 text-[13px] text-secondary-foreground leading-relaxed pl-[68px]">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-secondary/20 flex-wrap">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  {r.appointment?.date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={10} />
                      {new Date(r.appointment.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={10} />
                    {new Date(r.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {r.barber?.slug && r.shop?.slug && (
                    <Link href={`/${r.shop.slug}/berber/${r.barber.slug}`}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border bg-card rounded-full px-3 py-1.5 transition-colors no-underline">
                      <ExternalLink size={10} /> Berber
                    </Link>
                  )}
                  {r.shop?.slug && (
                    <Link href={`/${r.shop.slug}`}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border bg-card rounded-full px-3 py-1.5 transition-colors no-underline">
                      <ExternalLink size={10} /> Salon
                    </Link>
                  )}
                  {/* Mobile actions */}
                  <div className="flex sm:hidden gap-1.5">
                    <button onClick={() => setEditing({ id: r.id, barberRating: r.barberRating, comment: r.comment || "" })}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors">
                      <Pencil size={11} /> Düzenle
                    </button>
                    <button onClick={() => setDeleteId(r.id)}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-red-500 border border-red-200 rounded-full px-3 py-1.5 transition-colors">
                      <Trash2 size={11} /> Sil
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(17,17,17,0.5)" }} onClick={() => setEditing(null)}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.22, ease }}
              className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
              style={{ background: "var(--makas-surface)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-[20px]">Yorumu Düzenle</h3>
                <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
              <StarPicker value={editing.barberRating} onChange={v => setEditing(e => ({ ...e, barberRating: v }))} />
              <textarea value={editing.comment || ""} onChange={e => setEditing(ed => ({ ...ed, comment: e.target.value }))}
                placeholder="Yorumunuz (isteğe bağlı)" rows={4}
                className="w-full rounded-[12px] border border-border bg-background px-4 py-3 text-[14px] resize-none outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow" />
              <button onClick={saveEdit} disabled={saving}
                className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Kaydet
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(17,17,17,0.5)" }} onClick={() => !deleting && setDeleteId(null)}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.22, ease }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl"
              style={{ background: "var(--makas-surface)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 size={17} className="text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-[16px]">Yorumu Sil</h3>
                  <p className="text-[13px] text-muted-foreground">Bu işlem geri alınamaz.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className="flex-1 h-10 rounded-full border border-border text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  Vazgeç
                </button>
                <button onClick={doDelete} disabled={deleting}
                  className="flex-1 h-10 rounded-full bg-red-500 text-white text-[14px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting && <Loader2 size={13} className="animate-spin" />} Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({ user, onUpdated }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ displayName: user.displayName || "", phone: user.phone || "", birthday: "", gender: "" });
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [pwMsg, setPwMsg]     = useState(null);

  useEffect(() => {
    fetch("/api/customer/profile").then(r => r.json()).then(p => {
      setProfile(p);
      setForm({
        displayName: p.displayName || "",
        phone:       p.phone || "",
        birthday:    p.birthday ? new Date(p.birthday).toISOString().slice(0, 10) : "",
        gender:      p.gender || "",
      });
    }).catch(() => {});
  }, []);

  const set = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName || undefined,
        phone:       form.phone       || undefined,
        birthday:    form.birthday    || undefined,
        gender:      form.gender      || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) { await onUpdated?.(); toast.success("Profil güncellendi"); }
    else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Güncellenemedi"); }
  }

  const initials = user.displayName
    ? user.displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "M";

  return (
    <div className="max-w-[520px] space-y-8">
      {/* Avatar hero */}
      <div className="flex items-center gap-5 p-5 rounded-[16px] border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="w-16 h-16 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ background: "var(--makas-ink)" }}>
          <span className="font-display font-light text-[24px] text-[var(--makas-bg)]">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-[20px] tracking-tight text-foreground truncate">
            {profile?.displayName || user.displayName || "Müşteri"}
          </p>
          <p className="text-[13px] text-muted-foreground truncate">{user.email}</p>
          {user.createdAt && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Üye: {fmtDate(user.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={saveProfile} className="space-y-4">
        <h3 className="font-display font-semibold text-[19px] tracking-tight text-foreground">Profil Bilgileri</h3>

        <Field label="Ad Soyad">
          <input type="text" value={form.displayName} onChange={set("displayName")}
            placeholder="Adınız Soyadınız" className="field-inp" />
        </Field>
        <Field label="E-posta">
          <input type="email" value={profile?.email ?? user.email} disabled className="field-inp opacity-50 cursor-not-allowed" />
        </Field>
        <Field label="Telefon">
          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="5xx xxx xx xx" className="field-inp" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Doğum Tarihi">
            <input type="date" value={form.birthday} onChange={set("birthday")} className="field-inp" />
          </Field>
          <Field label="Cinsiyet">
            <select value={form.gender} onChange={set("gender")} className="field-inp">
              <option value="">Belirtilmemiş</option>
              <option value="MALE">Erkek</option>
              <option value="FEMALE">Kadın</option>
              <option value="OTHER">Diğer</option>
            </select>
          </Field>
        </div>

        <button type="submit" disabled={saving}
          className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
          {saving && <Loader2 size={15} className="animate-spin" />} Kaydet
        </button>
      </form>

      {/* Change password */}
      <div className="border-t border-border pt-6">
        <button onClick={() => setShowPw(v => !v)}
          className="flex items-center justify-between w-full text-left group">
          <div>
            <p className="font-semibold text-[15px] text-foreground">Şifre Değiştir</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Hesap güvenliğiniz için düzenli olarak güncelleyin</p>
          </div>
          <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${showPw ? "rotate-90" : ""}`} />
        </button>
        <AnimatePresence>
          {showPw && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
              <div className="pt-4">
                {pwMsg && (
                  <div className={`mb-3 p-3 rounded-[10px] text-[13px] font-medium ${pwMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {pwMsg.text}
                  </div>
                )}
                <ChangePasswordForm
                  onDone={() => { setShowPw(false); setPwMsg({ ok: true, text: "Şifre güncellendi" }); setTimeout(() => setPwMsg(null), 3000); }}
                  onError={msg => setPwMsg({ ok: false, text: msg })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Danger zone */}
      <div className="border-t border-border pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-red-500 mb-3">Tehlikeli Bölge</p>
        {!showDel ? (
          <button onClick={() => setShowDel(true)}
            className="flex items-center gap-2 text-[13px] text-red-600 hover:text-red-700 transition-colors">
            <Trash2 size={14} /> Hesabı Kalıcı Olarak Sil
          </button>
        ) : (
          <DeleteAccountConfirm onCancel={() => setShowDel(false)}
            onDone={async () => { await logout(); router.replace("/"); }} />
        )}
      </div>

      {/* .field-inp is defined in globals.css */}
    </div>
  );
}

function ChangePasswordForm({ onDone, onError }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (form.next !== form.confirm) { onError("Yeni şifreler eşleşmiyor"); return; }
    if (form.next.length < 8) { onError("Şifre en az 8 karakter olmalı"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
    });
    setLoading(false);
    if (res.ok) { onDone(); }
    else { const d = await res.json().catch(() => ({})); onError(d.error || "Güncellenemedi"); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {[
        { k: "current", label: "Mevcut Şifre" },
        { k: "next",    label: "Yeni Şifre" },
        { k: "confirm", label: "Yeni Şifre (Tekrar)" },
      ].map(({ k, label }) => (
        <div key={k} className="relative">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">{label}</label>
          <input type={show ? "text" : "password"} value={form[k]} onChange={set(k)}
            className="field-inp pr-10" required />
          {k === "next" && (
            <button type="button" onClick={() => setShow(v => !v)}
              className="absolute right-3 bottom-2.5 text-muted-foreground hover:text-foreground transition-colors">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="w-full h-10 rounded-full bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
        {loading && <Loader2 size={13} className="animate-spin" />} Şifreyi Güncelle
      </button>
    </form>
  );
}

function DeleteAccountConfirm({ onCancel, onDone }) {
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    const res = await fetch("/api/customer/profile", { method: "DELETE" });
    if (res.ok) { onDone(); } else { setLoading(false); toast.error("Hesap silinemedi"); }
  }

  return (
    <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-[13px] text-red-700 leading-relaxed">
        Hesabınız kalıcı olarak silinecek. Randevularınız, favorileriniz ve yorumlarınız dahil tüm veriler silinir. Bu işlem geri alınamaz.
      </p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 h-9 rounded-full border border-border text-[13px] font-medium hover:bg-secondary transition-colors">
          Vazgeç
        </button>
        <button onClick={confirm} disabled={loading}
          className="flex-1 h-9 rounded-full bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading && <Loader2 size={13} className="animate-spin" />} Hesabı Sil
        </button>
      </div>
    </div>
  );
}

// ── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({ user, onUpdated, onLogout }) {
  const [prefs, setPrefs] = useState({
    notifAppt:     user.notifAppt     ?? true,
    notifReminder: user.notifReminder ?? true,
    notifPromo:    user.notifPromo    ?? false,
  });

  async function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
    if (res.ok) { await onUpdated?.(); }
    else { setPrefs(prefs); toast.error("Kaydedilemedi"); }
  }

  const notifItems = [
    { key: "notifAppt",     label: "Randevu bildirimleri",  sub: "Yeni ve değişen randevularınız için" },
    { key: "notifReminder", label: "Hatırlatmalar",         sub: "Randevunuzdan önce hatırlatıcı" },
    { key: "notifPromo",    label: "Kampanya bildirimleri", sub: "İndirim ve fırsatlar" },
  ];

  return (
    <div className="max-w-[520px] space-y-6">
      {/* Notifications */}
      <div>
        <h3 className="font-display font-semibold text-[19px] tracking-tight text-foreground mb-4">Bildirimler</h3>
        <div className="rounded-[14px] border border-border bg-card overflow-hidden divide-y divide-border"
          style={{ boxShadow: "var(--shadow-card)" }}>
          {notifItems.map(({ key, label, sub }) => (
            <div key={key} onClick={() => toggle(key)}
              className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-secondary/40 transition-colors">
              <div className="flex items-center gap-3">
                {prefs[key] ? <Bell size={15} className="text-foreground" /> : <BellOff size={15} className="text-muted-foreground" />}
                <div>
                  <p className="text-[14px] font-medium text-foreground">{label}</p>
                  <p className="text-[12px] text-muted-foreground">{sub}</p>
                </div>
              </div>
              <Toggle on={prefs[key]} />
            </div>
          ))}
        </div>
      </div>

      {/* Account actions */}
      <div>
        <h3 className="font-display font-semibold text-[19px] tracking-tight text-foreground mb-4">Hesap</h3>
        <div className="rounded-[14px] border border-border bg-card overflow-hidden divide-y divide-border"
          style={{ boxShadow: "var(--shadow-card)" }}>
          <button onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-secondary/40 transition-colors">
            <div className="flex items-center gap-3">
              <LogOut size={15} className="text-muted-foreground" />
              <div>
                <p className="text-[14px] font-medium text-foreground">Çıkış Yap</p>
                <p className="text-[12px] text-muted-foreground">Hesabınızdan güvenli çıkış yapın</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────

function AccountPageInner() {
  const { user, loaded, logout, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") || "upcoming");
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState(null);

  const userId = user?.id;
  useEffect(() => {
    if (!loaded) return;
    if (!user) { router.replace("/login?redirect=/account"); return; }
    if (user.role !== "CUSTOMER") { router.replace("/admin"); return; }

    const ac = new AbortController();
    fetch("/api/customer/stats", { signal: ac.signal }).then(r => r.json()).then(d => setStats(d)).catch(() => {});
    fetch("/api/customer/appointments", { signal: ac.signal })
      .then(r => r.json())
      .then(d => setAppointments(Array.isArray(d) ? d : []))
      .catch(() => setAppointments([]));
    return () => ac.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, userId]);

  // Sync tab to URL without full navigation
  useEffect(() => {
    const url = tab === "upcoming" ? "/account" : `/account?tab=${tab}`;
    window.history.replaceState(null, "", url);
  }, [tab]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace("/");
  }, [logout, router]);

  if (!loaded || !user) return null;

  return (
    <div className="min-h-dvh" style={{ background: "var(--makas-bg)" }}>
      <Navbar />

      <div className="pt-[88px] flex" style={{ minHeight: "100dvh" }}>
        <AccountSidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} stats={stats} />

        <main className="flex-1 min-w-0 pb-24 md:pb-12">
          <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <StatsRow stats={stats} />

            <AnimatePresence mode="wait">
              <motion.div key={tab} variants={pageVar} initial="initial" animate="animate" exit="exit">
                {tab === "upcoming"  && <AppointmentsTab type="upcoming"  appointments={appointments} setAppointments={setAppointments} />}
                {tab === "history"   && <AppointmentsTab type="history"   appointments={appointments} setAppointments={setAppointments} />}
                {tab === "favorites" && <FavoritesTab />}
                {tab === "reviews"   && <MyReviewsTab onSwitchTab={setTab} />}
                {tab === "profile"   && <ProfileTab user={user} onUpdated={refreshUser} />}
                {tab === "settings"  && <SettingsTab user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <MobileBottomNav tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPageInner />
    </Suspense>
  );
}
