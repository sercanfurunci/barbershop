"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { todayStr, toDateStr } from "@/lib/utils";
import ManualBookingModal from "@/components/admin/ManualBookingModal";
import ImageCropModal from "@/components/shared/ImageCropModal";
import Link from "next/link";
import {
  Plus, LogOut, ChevronLeft, ChevronRight, ExternalLink,
  Phone, UserCheck, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight,
  CalendarDays, List, User, X, LayoutDashboard, Users, MoreHorizontal,
  Settings, Eye, EyeOff, Save, Loader2, AtSign, Star, Camera, Trash2, MessageSquare,
} from "lucide-react";

const C = {
  bg:       "#F7F4EE",
  bgSoft:   "#FDFBF7",
  card:     "#FFFFFF",
  cardHi:   "#FDFBF7",
  border:   "#E5DED3",
  borderHi: "#C5BEB5",
  surface:  "#EFEAE2",
  primary:  "#111111",
  secondary:"#4A4A4A",
  muted:    "#8A8480",
  dim:      "#C5BEB5",
};

// Simple 3-action flow: confirm arrival → done, or mark no-show
export const FLOW = [
  { key: "confirmed",  label: "Onaylandı",  shortLabel: "Onay",   color: "#15803D", bg: "rgba(34,197,94,0.12)"  },
  { key: "completed",  label: "Tamamlandı", shortLabel: "Tamam",  color: "#57514B", bg: "rgba(107,104,112,0.12)" },
  { key: "noshow",     label: "Gelmedi",    shortLabel: "Gelmedi",color: "#111111", bg: "rgba(17,17,17,0.12)"  },
];

export const ALL_STATUS = {
  pending:     { label: "Bekleniyor",  color: "#B45309", bg: "rgba(245,158,11,0.1)"  },
  confirmed:   { label: "Onaylandı",   color: "#15803D", bg: "rgba(34,197,94,0.1)"   },
  completed:   { label: "Tamamlandı",  color: "#57514B", bg: "rgba(107,104,112,0.1)" },
  noshow:      { label: "Gelmedi",     color: "#111111", bg: "rgba(17,17,17,0.1)"   },
  cancelled:   { label: "İptal",       color: "#52525b", bg: "rgba(82,82,91,0.1)"    },
  "in-progress": { label: "Devam",     color: "#2563EB", bg: "rgba(96,165,250,0.1)"  },
};

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function isToday(dateStr) {
  return dateStr === todayStr();
}

export function formatDateLong(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function nowTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
}

// ─── Next Appointment Card ────────────────────────────────────────────────────
export function NextAppointmentCard({ appt, onAction }) {
  if (!appt) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "44px", height: "44px", background: C.surface, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", opacity: 0.4 }}>✂</div>
        <div>
          <div style={{ fontSize: "13px", color: C.secondary }}>Sonraki randevu yok</div>
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>Bugün geri kalan süre için müsaitsiniz</div>
        </div>
      </div>
    );
  }

  const sc = ALL_STATUS[appt.status] ?? ALL_STATUS.pending;
  const isActive = false;

  return (
    <motion.div
      layout
      style={{
        background: isActive ? "#EFF4FD" : C.card,
        border: `1px solid ${isActive ? "rgba(96,165,250,0.25)" : sc.color + "40"}`,
        borderRadius: "12px",
        padding: "16px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isActive && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #2563EB, transparent)", opacity: 0.6 }} />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: "22px", color: sc.color, fontWeight: 700, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{appt.time}</div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>{appt.duration}dk</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "16px", color: C.primary, fontWeight: 600, marginBottom: "3px" }}>{appt.client}</div>
          <div style={{ fontSize: "13px", color: C.secondary, marginBottom: appt.phone ? "3px" : 0 }}>{appt.service}</div>
          {appt.phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <Phone size={10} style={{ color: C.muted }} />
              <span style={{ fontSize: "11px", color: C.muted }}>{appt.phone}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "5px", background: sc.bg, fontSize: "10px", color: sc.color, fontWeight: 600 }}>
            {sc.label}
          </div>
          <div style={{ fontSize: "14px", color: C.primary, fontWeight: 700, textAlign: "right" }}>
            ₺{(appt.price || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick action buttons */}
      <div style={{ display: "flex", gap: "6px", marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${C.border}` }}>
        {FLOW.filter(f => f.key !== appt.status).map(f => (
          <button
            key={f.key}
            onClick={() => onAction(appt.id, f.key)}
            style={{
              flex: 1, minHeight: "44px", borderRadius: "8px",
              background: "none", border: `1px solid ${C.border}`,
              fontSize: "12px", color: C.secondary, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = f.bg; e.currentTarget.style.borderColor = f.color + "40"; e.currentTarget.style.color = f.color; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
          >
            {f.shortLabel}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Timeline Item ────────────────────────────────────────────────────────────
export function TimelineItem({ appt, isNext, isPast, onAction, index }) {
  const [expanded, setExpanded] = useState(false);
  const sc    = ALL_STATUS[appt.status] ?? ALL_STATUS.pending;
  const isDone = ["completed", "noshow", "cancelled"].includes(appt.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <div
        onClick={() => !isDone && setExpanded(v => !v)}
        style={{
          background: isNext ? C.cardHi : C.card,
          border: `1px solid ${isNext ? sc.color + "55" : C.border}`,
          borderRadius: "10px",
          padding: "14px 16px",
          cursor: isDone ? "default" : "pointer",
          opacity: isPast && isDone ? 0.55 : 1,
          transition: "all 0.15s",
          position: "relative",
        }}
        onMouseEnter={e => { if (!isDone) { e.currentTarget.style.borderColor = sc.color + "55"; e.currentTarget.style.background = C.cardHi; }}}
        onMouseLeave={e => { if (!isDone) { e.currentTarget.style.borderColor = isNext ? sc.color + "55" : C.border; e.currentTarget.style.background = isNext ? C.cardHi : C.card; }}}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Time */}
          <div style={{ textAlign: "center", minWidth: "42px", flexShrink: 0 }}>
            <div style={{ fontSize: "14px", color: isNext ? sc.color : C.primary, fontWeight: 700, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
              {appt.time}
            </div>
            <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>{appt.duration}dk</div>
          </div>

          <div style={{ width: "1px", height: "36px", background: C.border, flexShrink: 0 }} />

          {/* Client + service */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {appt.client}
              {appt.source === "phone" && (
                <span style={{ marginLeft: "6px", fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(96,165,250,0.1)", color: "#2563EB", border: "1px solid rgba(96,165,250,0.2)", fontWeight: 600, verticalAlign: "middle" }}>TEL</span>
              )}
            </div>
            <div style={{ fontSize: "11px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "1px" }}>
              {appt.service}
              {appt.phone && <span style={{ marginLeft: "8px", color: C.muted }}>· {appt.phone}</span>}
            </div>
          </div>

          {/* Price */}
          <div style={{ fontSize: "14px", color: isDone ? C.secondary : C.primary, fontWeight: 600, flexShrink: 0 }}>
            ₺{(appt.price || 0).toLocaleString()}
          </div>

          {/* Status badge */}
          <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 8px", borderRadius: "5px", background: sc.bg, fontSize: "10px", color: sc.color, fontWeight: 600, flexShrink: 0, minWidth: "60px", justifyContent: "center" }}>
            {sc.label}
          </div>
        </div>

        {/* Quick actions (expanded) */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "flex", gap: "6px", marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}` }}>
                {FLOW.map(f => (
                  <button
                    key={f.key}
                    onClick={(e) => { e.stopPropagation(); onAction(appt.id, f.key); setExpanded(false); }}
                    style={{
                      flex: 1, minHeight: "44px", borderRadius: "8px",
                      background: appt.status === f.key ? f.bg : "none",
                      border: `1px solid ${appt.status === f.key ? f.color + "50" : C.border}`,
                      fontSize: "12px", color: appt.status === f.key ? f.color : C.secondary,
                      cursor: "pointer", fontWeight: appt.status === f.key ? 600 : 400,
                    }}
                    onMouseEnter={e => { if (appt.status !== f.key) { e.currentTarget.style.background = f.bg; e.currentTarget.style.color = f.color; }}}
                    onMouseLeave={e => { if (appt.status !== f.key) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.secondary; }}}
                  >
                    {f.shortLabel}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Barber Day View (shared / embeddable) ────────────────────────────────────
export function BarberDayView({ barberId, date, appointments, updateStatus }) {
  const now        = nowTimeStr();
  const isToday_   = isToday(date);
  const dayAppts   = appointments
    .filter(a => a.barberId === barberId && a.date === date && a.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));
  const pending    = dayAppts.filter(a => a.status === "pending").length;
  const confirmed  = dayAppts.filter(a => a.status === "confirmed").length;
  const completed  = dayAppts.filter(a => a.status === "completed").length;
  const revenue    = dayAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0);
  const nextAppt   = isToday_ ? dayAppts.find(a => a.time >= now && ["pending", "confirmed"].includes(a.status)) : null;
  const displayNext = nextAppt;

  return (
    <>
      {/* Stats strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" style={{ marginBottom: "16px" }}>
        {[
          { label: "Toplam",   value: dayAppts.length,    color: C.primary,   span: false },
          { label: "Onaylı",   value: confirmed,           color: "#15803D",   span: false },
          { label: "Bekliyor", value: pending,             color: "#B45309",   span: false },
          { label: "Tamam",    value: completed,           color: C.secondary, span: false },
          { label: "Kasa",     value: `₺${revenue.toLocaleString()}`, color: C.primary, span: true },
        ].map((s, i) => (
          <div key={i} className={s.span ? "col-span-2 sm:col-span-1" : ""} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "16px", color: s.color, fontWeight: 600, lineHeight: 1, marginBottom: "3px" }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next / active appointment */}
      {isToday_ && (
        <div style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            {"Sonraki Randevu"}
          </div>
          <NextAppointmentCard appt={displayNext} onAction={updateStatus} />
        </div>
      )}

      {/* Pending banner */}
      {pending > 0 && isToday_ && (
        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={14} style={{ color: "#B45309", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#B45309", fontWeight: 500 }}>{pending} randevu onay bekliyor</span>
        </div>
      )}

      {/* Timeline */}
      <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
        {isToday_ ? "Bugünün Programı" : "Günün Programı"} · {dayAppts.length} randevu
      </div>
      {dayAppts.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "40px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "24px", opacity: 0.2, marginBottom: "8px" }}>✂</div>
          <div style={{ fontSize: "13px", color: C.secondary }}>Bu gün için randevu yok</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {dayAppts.map((appt, i) => {
            const isPast = isToday_ && appt.time < now;
            const isNext = appt.id === displayNext?.id;
            return <TimelineItem key={appt.id} appt={appt} isNext={isNext} isPast={isPast} onAction={updateStatus} index={i} />;
          })}
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BarberDashboardClient({ barberId: barberSlug, shopSlug: shopSlugProp }) {
  const router = useRouter();
  const { role, user, logout, loaded: authLoaded } = useAuth();
  const { appointments, updateStatus, refresh } = useAppointments();
  const [date, setDate]       = useState(todayStr());
  const [view, setView]       = useState("dashboard");
  const [moreSheet, setMoreSheet] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [barberData, setBarberData] = useState(null);
  const [tick, setTick]     = useState(0);
  const [mounted, setMounted] = useState(false);
  const loggingOut = useRef(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  // Fetch real barber data from API, poll every 30s, refresh on tab focus
  const fetchBarberData = useCallback(() => {
    const shopId = user?.shop?.id;
    if (!shopId) return;
    apiFetch(`/api/barbers?shopId=${shopId}`).then(list => {
      const found = list.find(b => b.slug === barberSlug);
      if (found) setBarberData(found);
    }).catch(() => {});
  }, [barberSlug, user?.shop?.id]);

  useEffect(() => {
    fetchBarberData();
    const id = setInterval(fetchBarberData, 30_000);
    return () => clearInterval(id);
  }, [fetchBarberData]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") { fetchBarberData(); refresh(); } };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchBarberData, refresh]);

  useEffect(() => {
    if (!authLoaded) return;
    if (!role) {
      const dest = (user?.shop?.slug ?? shopSlugProp);
      router.replace(dest ? `/${dest}/barber` : "/");
      return;
    }
    const shopSlug = user?.shop?.slug;
    if (role !== "admin" && role !== barberSlug && shopSlug) {
      router.replace(`/${shopSlug}/barber/${role}`);
    }
  }, [role, authLoaded, barberSlug, router, user?.shop?.slug]);

  // Block render until auth is confirmed
  if (!authLoaded || !role) return null;

  // Real DB barberId: for logged-in barber use user.barber.id; for admin viewing use barberData.id
  const realBarberId = user?.barber?.slug === barberSlug ? user.barber.id : barberData?.id;
  const barber = barberData ?? (user?.barber?.slug === barberSlug ? { ...user.barber, nameTr: user.barber.nameTr ?? user.barber.name, name: user.barber.nameTr ?? user.barber.name, title: { tr: "Berber", en: "Barber" }, avatar: user.barber.avatar } : null);

  if (!barber || !mounted) return null;

  const today          = todayStr();
  const viewDate       = view === "dashboard" ? today : date;
  const viewing        = viewDate;
  const isViewingToday = isToday(viewing);

  const dayAppts = appointments
    .filter(a => (realBarberId ? a.barberId === realBarberId : a.barberId === barberSlug) && a.date === viewing && a.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));

  const now = nowTimeStr();

  const nextAppt = isViewingToday
    ? dayAppts.find(a => a.time >= now && ["pending", "confirmed"].includes(a.status))
    : null;

  const displayNext = nextAppt;

  // Stats
  const pending   = dayAppts.filter(a => a.status === "pending").length;
  const confirmed = dayAppts.filter(a => a.status === "confirmed").length;
  const completed = dayAppts.filter(a => a.status === "completed").length;
  const noshow    = dayAppts.filter(a => a.status === "noshow").length;
  const revenue   = dayAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0);
  // WorkingHours are in minutes (540 = 09:00); derive today's dow for accurate hours
  const todayDow = ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];
  const whRaw    = barberData?.workingHours;
  const whStart  = whRaw ? (whRaw[`${todayDow}Start`] ?? 540)  : 540;
  const whEnd    = whRaw ? (whRaw[`${todayDow}End`]   ?? 1080) : 1080;
  const wh       = { start: whStart, end: whEnd };
  const totalSlots = Math.floor((wh.end - wh.start) / 30);
  const freeSlots  = Math.max(0, totalSlots - dayAppts.length);

  // Weekly stats (last 7 days)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return toDateStr(d);
  });
  const weekData = weekDays.map(d => {
    const appts = appointments.filter(a => (realBarberId ? a.barberId === realBarberId : true) && a.date === d && a.status === "completed");
    return { date: d, count: appts.length, revenue: appts.reduce((s, a) => s + (a.price || 0), 0) };
  });
  const weekRevenue = weekData.reduce((s, d) => s + d.revenue, 0);
  const weekAppts   = weekData.reduce((s, d) => s + d.count, 0);
  const maxCount    = Math.max(...weekData.map(d => d.count), 1);

  const SIDEBAR_NAV = [
    { id: "dashboard",    label: "Dashboard",  icon: LayoutDashboard },
    { id: "schedule",     label: "Program",    icon: CalendarDays    },
    { id: "appointments", label: "Randevular", icon: List            },
    { id: "customers",    label: "Müşteriler", icon: Users           },
    { id: "reviews",      label: "Yorumlar",   icon: Star            },
    { id: "profil",       label: "Profil",     icon: Settings        },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: C.bg }}>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30 w-[220px]"
        style={{ background: C.card, borderRight: `1px solid ${C.border}` }}>

        {/* Logo / Barber identity */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {barber.avatar}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", color: C.primary, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{barber.nameTr ?? barber.name}</div>
              <div style={{ fontSize: "10px", color: C.primary, letterSpacing: "0.06em", textTransform: "uppercase" }}>{barber.titleTr ?? barber.title?.tr ?? "Berber"}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {SIDEBAR_NAV.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => setView(id)}
                className="w-full flex items-center gap-3 transition-all"
                style={{ padding: "9px 10px", borderRadius: "8px", marginBottom: "2px", background: active ? `${C.primary}15` : "transparent", border: `1px solid ${active ? `${C.primary}30` : "transparent"}`, cursor: "pointer", textAlign: "left" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surface; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={15} style={{ color: active ? C.primary : C.muted, flexShrink: 0 }} />
                <span style={{ fontSize: "13px", color: active ? C.primary : C.secondary, fontWeight: active ? 500 : 400 }}>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: "12px 10px", borderTop: `1px solid ${C.border}` }}>
          {role === "admin" && (
            <button onClick={() => router.push(user?.shop?.slug ? `/${user.shop.slug}/admin` : "/admin")}
              className="w-full flex items-center gap-3 transition-all"
              style={{ padding: "9px 10px", borderRadius: "8px", marginBottom: "4px", background: "transparent", border: "1px solid transparent", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.surface; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <ChevronLeft size={15} style={{ color: C.muted }} />
              <span style={{ fontSize: "13px", color: C.secondary }}>Admin Paneli</span>
            </button>
          )}
          <Link href={user?.shop?.slug ? `/${user.shop.slug}` : "/"}
            className="w-full flex items-center gap-3 transition-all"
            style={{ padding: "9px 10px", borderRadius: "8px", marginBottom: "4px", display: "flex", textDecoration: "none" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.surface; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <ExternalLink size={15} style={{ color: C.muted }} />
            <span style={{ fontSize: "13px", color: C.secondary }}>Siteyi Gör</span>
          </Link>
          <button onClick={() => { { const s = user?.shop?.slug; loggingOut.current = true; logout(); router.push(s ? `/${s}/barber` : "/superadmin/login"); }; }}
            className="w-full flex items-center gap-3 transition-all"
            style={{ padding: "9px 10px", borderRadius: "8px", background: "transparent", border: "1px solid transparent", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={15} style={{ color: "#111111" }} />
            <span style={{ fontSize: "13px", color: "#111111" }}>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <BottomNav view={view} setView={setView} moreSheet={moreSheet} setMoreSheet={setMoreSheet} className="lg:hidden" />

      {/* ── More sheet (mobile) ── */}
      <AnimatePresence>
        {moreSheet && (
          <>
            <motion.div key="ms-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(17,17,17,0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => setMoreSheet(false)} />
            <motion.div key="ms-panel"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 right-0 bottom-0 z-50 lg:hidden rounded-t-2xl"
              style={{ background: C.card, border: `1px solid ${C.border}`, paddingBottom: "env(safe-area-inset-bottom, 16px)" }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: C.dim }} />
              </div>
              {/* Identity */}
              <div style={{ padding: "12px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{barber.avatar}</div>
                <div>
                  <div style={{ fontSize: "14px", color: C.primary, fontWeight: 600 }}>{barber.nameTr ?? barber.name}</div>
                  <div style={{ fontSize: "10px", color: C.primary, letterSpacing: "0.06em", textTransform: "uppercase" }}>{barber.titleTr ?? barber.title?.tr ?? "Berber"}</div>
                </div>
              </div>
              {/* Actions */}
              <div style={{ padding: "8px 12px" }}>
                <SheetItem icon={Settings} label="Profil" onClick={() => { setView("profil"); setMoreSheet(false); }} />
                {role === "admin" && (
                  <SheetItem icon={ChevronLeft} label="Admin Paneli" onClick={() => router.push(user?.shop?.slug ? `/${user.shop.slug}/admin` : "/admin")} />
                )}
                <SheetItem icon={ExternalLink} label="Siteyi Gör" onClick={() => window.open(user?.shop?.slug ? `/${user.shop.slug}` : "/", "_blank")} />
                <SheetItem icon={LogOut} label="Çıkış Yap" danger onClick={() => { { const s = user?.shop?.slug; loggingOut.current = true; logout(); router.push(s ? `/${s}/barber` : "/superadmin/login"); }; }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 lg:ml-[220px] flex flex-col min-h-screen overflow-x-hidden">

        {/* Topbar */}
        <header className="h-14 flex items-center gap-4 px-4 lg:px-7 sticky top-0 z-20"
          style={{ background: `${C.bg}e8`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}>
          {/* Barber identity — mobile only, replaces hamburger */}
          <div className="flex items-center gap-2 lg:hidden" style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <div style={{ width: "28px", height: "28px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {barber.avatar}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: C.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{barber.nameTr ?? barber.name}</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={refresh} title="Yenile"
              style={{ background: C.surface, color: C.secondary, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "0 12px", height: "36px", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              ↻
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5"
              style={{ background: C.primary, color: "#fff", border: "none", borderRadius: "8px", padding: "0 14px", height: "36px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> <span className="hidden sm:inline">Randevu Ekle</span><span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </header>

        {/* Page content — extra bottom padding so content clears mobile bottom nav */}
        <div className="px-4 pt-5 pb-24 lg:px-7 lg:pt-7 lg:pb-10">

        {/* Page header */}
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
          <div>
            {(view === "dashboard" || view === "schedule") && (
              <>
                <h1 style={{ fontSize: "clamp(20px, 2.5vw, 26px)", color: C.primary, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "4px" }}>
                  {view === "dashboard" ? formatDateLong(today) : formatDateLong(viewing)}
                  {(view === "dashboard" || isViewingToday) && (
                    <span style={{ marginLeft: "10px", fontSize: "10px", color: C.primary, fontWeight: 700, letterSpacing: "0.12em", verticalAlign: "middle", textTransform: "uppercase" }}>Bugün</span>
                  )}
                </h1>
                <p style={{ fontSize: "13px", color: C.secondary }}>{String(Math.floor(wh.start/60)).padStart(2,"0")}:{String(wh.start%60).padStart(2,"0")} – {String(Math.floor(wh.end/60)).padStart(2,"0")}:{String(wh.end%60).padStart(2,"0")} · {dayAppts.length} randevu</p>
              </>
            )}
            {view === "appointments" && <h1 style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.02em" }}>Randevular</h1>}
            {view === "customers" && <h1 style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.02em" }}>Müşteriler</h1>}
            {view === "profil" && <h1 style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.02em" }}>Profil</h1>}
          </div>
          {view === "schedule" && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              <button onClick={() => setDate(d => addDays(d, -1))} style={{ width: "36px", height: "36px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
                <ChevronLeft size={15} />
              </button>
              {!isViewingToday && (
                <button onClick={() => setDate(today)} style={{ height: "36px", padding: "0 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px", color: C.secondary, cursor: "pointer" }}>Bugün</button>
              )}
              <button onClick={() => setDate(d => addDays(d, 1))} style={{ width: "36px", height: "36px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>

        {/* ── Dashboard / Schedule view ── */}
        {(view === "dashboard" || view === "schedule") && (
          <>
            {/* KPI cards row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4" style={{ marginBottom: "24px" }}>
              {[
                { label: "Toplam",   value: dayAppts.length,                   color: C.primary   },
                { label: "Onaylı",   value: confirmed,                          color: "#15803D"   },
                { label: "Bekliyor", value: pending,                            color: "#B45309"   },
                { label: "Tamam",    value: completed,                          color: C.secondary },
                { label: "Bugün Kazanç", value: `₺${revenue.toLocaleString()}`, color: C.primary   },
              ].map((s, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 18px" }}>
                  <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{s.label}</div>
                  <div style={{ fontSize: "24px", color: s.color, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* 2-column desktop grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

              {/* Left: timeline */}
              <div>
                {/* Pending banner */}
                {pending > 0 && isViewingToday && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <AlertCircle size={14} style={{ color: "#B45309" }} />
                      <span style={{ fontSize: "13px", color: "#B45309", fontWeight: 500 }}>{pending} randevu onay bekliyor</span>
                    </div>
                    <span style={{ fontSize: "11px", color: C.secondary }}>Aşağıdan güncelleyin</span>
                  </motion.div>
                )}

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>
                      {isViewingToday ? "Bugünün Programı" : "Günün Programı"}
                    </div>
                    <span style={{ fontSize: "11px", color: C.muted, background: C.surface, padding: "2px 8px", borderRadius: "5px", border: `1px solid ${C.border}` }}>{dayAppts.length} randevu</span>
                  </div>
                  <div style={{ padding: "12px" }}>
                    {dayAppts.length === 0 ? (
                      <div style={{ padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.2 }}>✂</div>
                        <div style={{ fontSize: "13px", color: C.secondary, marginBottom: "14px" }}>Bu gün için randevu yok</div>
                        <button onClick={() => setShowModal(true)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: `1px solid rgba(17,17,17,0.3)`, borderRadius: "6px", padding: "7px 16px", fontSize: "12px", color: C.primary, cursor: "pointer" }}>
                          <Plus size={12} /> Randevu Ekle
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {dayAppts.map((appt, i) => {
                          const isPast = isViewingToday && appt.time < now;
                          const isNext = appt.id === displayNext?.id;
                          return <TimelineItem key={appt.id} appt={appt} isNext={isNext} isPast={isPast} onAction={updateStatus} index={i} />;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: next appt + weekly stats (dashboard only) */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {isViewingToday && (
                  <div>
                    <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
                      {"Sonraki Randevu"}
                    </div>
                    <NextAppointmentCard appt={displayNext} onAction={updateStatus} />
                  </div>
                )}

                {view === "dashboard" && (
                  <>
                    {/* Weekly KPIs */}
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px" }}>
                      <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>Bu Hafta</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                        <div>
                          <div style={{ fontSize: "20px", color: C.primary, fontWeight: 600, letterSpacing: "-0.02em" }}>₺{weekRevenue.toLocaleString()}</div>
                          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>Toplam kazanç</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "20px", color: C.primary, fontWeight: 600, letterSpacing: "-0.02em" }}>{weekAppts}</div>
                          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>Tamamlanan</div>
                        </div>
                      </div>

                      {/* Mini bar chart */}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "56px" }}>
                        {weekData.map((d, i) => {
                          const isToday_ = d.date === today;
                          const h = maxCount > 0 ? Math.max((d.count / maxCount) * 100, d.count > 0 ? 15 : 5) : 5;
                          const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "narrow" });
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                                <motion.div
                                  initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                  transition={{ delay: i * 0.04, duration: 0.35, ease: "easeOut" }}
                                  style={{ width: "100%", background: isToday_ ? C.primary : d.count > 0 ? "rgba(17,17,17,0.3)" : C.dim, borderRadius: "3px 3px 0 0", minHeight: "3px" }}
                                />
                              </div>
                              <div style={{ fontSize: "8px", color: isToday_ ? C.primary : C.muted, fontWeight: isToday_ ? 700 : 400 }}>{dayLabel}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Day summary */}
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "18px" }}>
                      <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>Gün Özeti</div>
                      {[
                        { label: "Tamamlanan",  value: completed,                      color: C.secondary },
                        { label: "Bugün Kazanç",value: `₺${revenue.toLocaleString()}`, color: C.primary   },
                        { label: "Gelmedi",     value: noshow,   color: noshow > 0 ? "#111111" : C.muted  },
                        { label: "Tahmini Müsait Slot", value: freeSlots,                color: C.muted     },
                      ].map((s, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: i < 3 ? "10px" : 0 }}>
                          <span style={{ fontSize: "12px", color: C.secondary }}>{s.label}</span>
                          <span style={{ fontSize: "13px", color: s.color, fontWeight: 500 }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Randevular view ── */}
        {view === "appointments" && (
          <BarberAppointmentsList barberId={realBarberId ?? barberSlug} appointments={appointments} onAction={updateStatus} onNewBooking={() => setShowModal(true)} />
        )}

        {/* ── Müşteriler view ── */}
        {view === "customers" && (
          <BarberCustomersView barberId={realBarberId ?? barberSlug} appointments={appointments} onNewBooking={() => setShowModal(true)} />
        )}

        {/* ── Reviews view ── */}
        {view === "reviews" && <BarberReviewsTab />}

        {/* ── Profil view ── */}
        {view === "profil" && <ProfileTab />}

      {showModal && (
        <ManualBookingModal
          defaultBarberId={barberSlug}
          initialDate={date}
          onClose={() => setShowModal(false)}
        />
      )}
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Tab ────────────────────────────────────────────────────────── */

function ProfileTab() {
  const { user, updateUser } = useAuth();

  const [username, setUsername]       = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]   = useState(null); // { ok, text }

  const [profilePhoto, setProfilePhoto] = useState(user?.barber?.profilePhoto ?? null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [cropFile, setCropFile]         = useState(null);
  const photoRef = useRef(null);

  const [curPwd, setCurPwd]   = useState("");
  const [newPwd, setNewPwd]   = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg]   = useState(null);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
      setProfileMsg({ ok: false, text: "Kullanıcı adı 3-20 karakter, sadece küçük harf/rakam/_ olabilir" });
      return;
    }
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const updated = await apiFetch("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ username: username || null, displayName: displayName || null }),
      });
      updateUser({ username: updated.username, displayName: updated.displayName });
      setProfileMsg({ ok: true, text: "Profil güncellendi" });
    } catch (err) {
      setProfileMsg({ ok: false, text: err.message ?? "Profil kaydedilemedi. Tekrar deneyin." });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6) { setPwdMsg({ ok: false, text: "Yeni şifre en az 6 karakter olmalı" }); return; }
    if (newPwd !== confPwd) { setPwdMsg({ ok: false, text: "Şifreler eşleşmiyor" }); return; }
    setPwdSaving(true);
    setPwdMsg(null);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      setCurPwd(""); setNewPwd(""); setConfPwd("");
      setPwdMsg({ ok: true, text: "Şifre başarıyla değiştirildi" });
    } catch (err) {
      setPwdMsg({ ok: false, text: err.message ?? "Şifre değiştirilemedi. Tekrar deneyin." });
    } finally {
      setPwdSaving(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: "100%", background: C.card, border: `1px solid ${hasError ? "rgba(17,17,17,0.5)" : C.border}`,
    borderRadius: "10px", padding: "12px 14px", fontSize: "14px", color: C.primary,
    outline: "none", caretColor: C.primary, boxSizing: "border-box",
  });

  const uploadPhoto = async (dataUrl) => {
    setPhotoLoading(true);
    try {
      const res = await apiFetch("/api/barber/photo", { method: "POST", body: JSON.stringify({ photo: dataUrl }) });
      setProfilePhoto(res.profilePhoto);
    } catch (err) { alert(err.message || "Fotoğraf yüklenemedi"); }
    finally { setPhotoLoading(false); }
  };

  const removePhoto = async () => {
    if (!confirm("Fotoğrafı kaldırmak istiyor musun?")) return;
    setPhotoLoading(true);
    try {
      await apiFetch("/api/barber/photo", { method: "DELETE" });
      setProfilePhoto(null);
    } catch { /* ignore */ }
    finally { setPhotoLoading(false); }
  };

  return (
    <div>
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onConfirm={dataUrl => { setCropFile(null); uploadPhoto(dataUrl); }}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* Facebook-style profile photo card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "24px 20px 20px", marginBottom: "16px" }}>
        <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { setCropFile(f); e.target.value = ""; } }} />

        {/* Avatar + info row */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
          {/* Circular avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 96, height: 96, borderRadius: "50%",
              overflow: "hidden", background: "#16120f",
              border: `3px solid ${C.border}`,
              cursor: "pointer",
              position: "relative",
            }}
              onClick={() => !photoLoading && photoRef.current?.click()}
            >
              {profilePhoto ? (
                <Image
                  src={profilePhoto} alt="Profil"
                  fill
                  sizes="96px"
                  style={{ objectFit: "cover", objectPosition: "center center" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${C.primary}, #111111)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, color: "#fff" }}>
                  {user?.barber?.avatar ?? "A"}
                </div>
              )}
              {/* Hover overlay */}
              <div
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.18s", borderRadius: "50%" }}
                onMouseEnter={e => { if (!photoLoading) e.currentTarget.style.opacity = 1; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = 0; }}
              >
                {photoLoading ? <Loader2 size={18} color="#fff" className="animate-spin" /> : <Camera size={18} color="#fff" />}
              </div>
            </div>
            {/* Camera badge */}
            <button
              onClick={() => !photoLoading && photoRef.current?.click()}
              style={{
                position: "absolute", bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: "50%",
                background: C.primary, border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Camera size={12} color="#fff" />
            </button>
          </div>

          {/* Name + title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "17px", fontWeight: 700, color: C.primary, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: "3px" }}>
              {user?.displayName ?? user?.barber?.nameTr ?? "Profil"}
            </div>
            <div style={{ fontSize: "10px", color: C.primary, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: "4px" }}>
              {user?.barber?.titleTr ?? "Berber"}
            </div>
            <div style={{ fontSize: "12px", color: C.muted }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => photoRef.current?.click()} disabled={photoLoading}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", background: C.surface, color: C.primary, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: photoLoading ? "not-allowed" : "pointer", opacity: photoLoading ? 0.6 : 1 }}>
            <Camera size={13} /> {profilePhoto ? "Fotoğrafı Değiştir" : "Fotoğraf Yükle"}
          </button>
          {profilePhoto && (
            <button onClick={removePhoto} disabled={photoLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "9px 14px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Trash2 size={12} /> Kaldır
            </button>
          )}
        </div>
      </div>

      {/* Identity card — merge with profile above, just show email/username now */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "14px" }}>
        {profilePhoto ? (
          <Image src={profilePhoto} alt="Profil" width={40} height={40}
            sizes="40px"
            style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: "40px", height: "40px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {user?.barber?.avatar ?? "A"}
          </div>
        )}
        <div>
          <div style={{ fontSize: "14px", color: C.primary, fontWeight: 600 }}>{user?.displayName ?? user?.barber?.nameTr ?? "Admin"}</div>
          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>{user?.username ? `@${user.username}` : user?.email}</div>
        </div>
      </div>

      {/* Profile info form */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px", marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "18px" }}>Profil Bilgileri</div>
        <form onSubmit={saveProfile}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, marginBottom: "6px", letterSpacing: "0.05em" }}>KULLANICI ADI</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }}>
                <AtSign size={14} />
              </span>
              <input
                type="text"
                placeholder="kullanici_adi"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                style={{ ...inputStyle(false), paddingLeft: "34px" }}
                onFocus={e => { e.target.style.borderColor = `${C.primary}60`; }}
                onBlur={e => { e.target.style.borderColor = C.border; }}
              />
            </div>
            <div style={{ fontSize: "10px", color: C.muted, marginTop: "5px" }}>3-20 karakter, küçük harf/rakam/_ · Kullanıcı adıyla da giriş yapabilirsin</div>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "11px", color: C.muted, marginBottom: "6px", letterSpacing: "0.05em" }}>GÖRÜNEN AD</label>
            <input
              type="text"
              placeholder="Görünür isim (opsiyonel)"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              style={inputStyle(false)}
              onFocus={e => { e.target.style.borderColor = `${C.primary}60`; }}
              onBlur={e => { e.target.style.borderColor = C.border; }}
            />
          </div>

          {profileMsg && (
            <div style={{ background: profileMsg.ok ? "rgba(34,197,94,0.08)" : "rgba(17,17,17,0.08)", border: `1px solid ${profileMsg.ok ? "rgba(34,197,94,0.25)" : "rgba(17,17,17,0.25)"}`, borderRadius: "8px", padding: "9px 13px", marginBottom: "14px", fontSize: "12px", color: profileMsg.ok ? "#15803D" : C.primary }}>
              {profileMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={profileSaving}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: C.primary, color: "#fff", border: "none", borderRadius: "9px", padding: "11px 20px", fontSize: "13px", fontWeight: 600, cursor: profileSaving ? "not-allowed" : "pointer", opacity: profileSaving ? 0.7 : 1 }}
          >
            {profileSaving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            Kaydet
          </button>
        </form>
      </div>

      {/* Password change form */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px" }}>
        <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "18px" }}>Şifre Değiştir</div>
        <form onSubmit={changePassword}>
          {[
            { label: "MEVCUT ŞİFRE", val: curPwd, set: setCurPwd },
            { label: "YENİ ŞİFRE",   val: newPwd, set: setNewPwd },
            { label: "YENİ ŞİFRE (TEKRAR)", val: confPwd, set: setConfPwd },
          ].map(({ label, val, set }, i) => (
            <div key={label} style={{ marginBottom: i < 2 ? "12px" : "18px" }}>
              <label style={{ display: "block", fontSize: "11px", color: C.muted, marginBottom: "6px", letterSpacing: "0.05em" }}>{label}</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  value={val}
                  onChange={e => set(e.target.value)}
                  style={{ ...inputStyle(false), paddingRight: "44px" }}
                  onFocus={e => { e.target.style.borderColor = `${C.primary}60`; }}
                  onBlur={e => { e.target.style.borderColor = C.border; }}
                />
                {i === 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}

          {pwdMsg && (
            <div style={{ background: pwdMsg.ok ? "rgba(34,197,94,0.08)" : "rgba(17,17,17,0.08)", border: `1px solid ${pwdMsg.ok ? "rgba(34,197,94,0.25)" : "rgba(17,17,17,0.25)"}`, borderRadius: "8px", padding: "9px 13px", marginBottom: "14px", fontSize: "12px", color: pwdMsg.ok ? "#15803D" : C.primary }}>
              {pwdMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwdSaving || !curPwd || !newPwd || !confPwd}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: C.primary, color: "#fff", border: "none", borderRadius: "9px", padding: "11px 20px", fontSize: "13px", fontWeight: 600, cursor: (pwdSaving || !curPwd || !newPwd || !confPwd) ? "not-allowed" : "pointer", opacity: (pwdSaving || !curPwd || !newPwd || !confPwd) ? 0.5 : 1 }}
          >
            {pwdSaving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={14} />}
            Şifreyi Değiştir
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Barber Reviews Tab ─────────────────────────────────────────────────── */

function BarberReviewsTab() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/barber/reviews")
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Loader2 size={18} style={{ color: C.muted }} className="animate-spin" />
      </div>
    );
  }

  const stats    = data?.stats;
  const reviews  = data?.reviews ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: C.primary, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {stats?.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
            </div>
            <div style={{ display: "flex", gap: 3, margin: "6px 0 4px" }}>
              {[1,2,3,4,5].map(n => (
                <Star key={n} size={14} fill={n <= Math.round(stats?.avgRating ?? 0) ? C.primary : "none"} style={{ color: n <= Math.round(stats?.avgRating ?? 0) ? C.primary : C.dim }} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: C.muted }}>{stats?.totalCount ?? 0} değerlendirme</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {(stats?.distribution ?? []).map(({ stars, count }) => {
              const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
              return (
                <div key={stars} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.muted, width: 14, textAlign: "right" }}>{stars}</span>
                  <Star size={9} fill={C.primary} style={{ color: C.primary }} />
                  <div style={{ flex: 1, height: 5, background: C.surface, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: C.primary, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 9, color: C.muted, width: 16 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "32px 24px", textAlign: "center" }}>
          <MessageSquare size={28} style={{ color: C.dim, marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: C.muted }}>Henüz yorum yok</p>
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {reviews.map((r, i) => (
            <div key={r.id} style={{
              padding: "14px 20px",
              borderBottom: i < reviews.length - 1 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} size={11} fill={n <= (r.rating ?? 0) ? C.primary : "none"} style={{ color: n <= (r.rating ?? 0) ? C.primary : C.dim }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.primary }}>{r.customerName}</span>
                <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto" }}>{formatRelBd(r.reviewedAt)}</span>
              </div>
              {r.comment && (
                <p style={{ fontSize: 12, color: C.secondary, lineHeight: 1.55 }}>{r.comment}</p>
              )}
              {r.appointment?.service?.nameTr && (
                <p style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{r.appointment.service.nameTr}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelBd(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s`;
  return `${Math.floor(h / 24)}g`;
}

function resizeImageBarber(file, maxDim = 300) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

/* ─── Barber Bottom Navigation ───────────────────────────────────────────── */

const BARBER_NAV = [
  { id: "dashboard",    label: "Dashboard",  icon: LayoutDashboard },
  { id: "schedule",     label: "Program",    icon: CalendarDays    },
  { id: "appointments", label: "Randevular", icon: List            },
  { id: "customers",    label: "Müşteriler", icon: Users           },
  { id: "more",         label: "Daha Fazla", icon: MoreHorizontal  },
];

function BarberBottomNav({ view, setView, moreOpen, setMoreOpen, barber, onLogout }) {
  const handleSelect = (id) => {
    if (id === "more") { setMoreOpen(v => !v); return; }
    setView(id);
    setMoreOpen(false);
  };

  return (
    <>
      {/* More sheet backdrop */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="more-bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(17,17,17,0.35)", backdropFilter: "blur(3px)" }}
            onClick={() => setMoreOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* More bottom sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="more-sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380, mass: 0.9 }}
            className="fixed left-0 right-0 z-50"
            style={{
              bottom: "calc(64px + env(safe-area-inset-bottom))",
              background: C.card,
              borderTop: `1px solid ${C.border}`,
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -8px 40px rgba(17,17,17,0.15)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: C.dim }} />
            </div>

            {/* Barber mini card */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{
                width: "44px", height: "44px", flexShrink: 0,
                background: `linear-gradient(135deg, ${C.primary}, #111111)`,
                borderRadius: "12px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff",
              }}>
                {barber?.avatar}
              </div>
              <div>
                <div style={{ fontSize: "14px", color: C.primary, fontWeight: 600 }}>{barber?.nameTr ?? barber?.name}</div>
                <div style={{ fontSize: "10px", color: C.primary, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "2px" }}>{barber?.titleTr ?? barber?.title?.tr}</div>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: "8px 12px 12px" }}>
              {[
                {
                  icon: ExternalLink,
                  label: "Siteyi Görüntüle",
                  sublabel: "Müşteri sayfasına git",
                  href: "/",
                  danger: false,
                },
              ].map(({ icon: Icon, label, sublabel, href }) => (
                <Link key={label} href={href} onClick={() => setMoreOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", borderRadius: "10px", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} style={{ color: C.secondary }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>{label}</div>
                    <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>{sublabel}</div>
                  </div>
                </Link>
              ))}

              <button
                onClick={() => { setMoreOpen(false); onLogout(); }}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", borderRadius: "10px", width: "100%", background: "none", border: "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <LogOut size={16} style={{ color: "#111111" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "13px", color: "#111111", fontWeight: 500 }}>Çıkış Yap</div>
                  <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>Oturumu kapat</div>
                </div>
              </button>
            </div>

            {/* Safe area spacer */}
            <div style={{ height: "4px" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav bar */}
      <div
        className="fixed left-0 right-0 z-40"
        style={{
          bottom: 0,
          height: "calc(64px + env(safe-area-inset-bottom))",
          background: `${C.card}f8`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "flex-start",
          paddingTop: "4px",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {BARBER_NAV.map(({ id, label, icon: Icon }) => {
          const isMore  = id === "more";
          const active  = isMore ? moreOpen : (view === id && !moreOpen);

          return (
            <button
              key={id}
              onClick={() => handleSelect(id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "4px", minHeight: "56px",
                background: "none", border: "none", cursor: "pointer", padding: "4px 2px",
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {active && (
                  <motion.div
                    layoutId="barber-nav-pill"
                    style={{ position: "absolute", inset: "-6px -10px", background: `${C.primary}18`, borderRadius: "10px" }}
                    transition={{ type: "spring", damping: 28, stiffness: 380 }}
                  />
                )}
                <motion.div animate={{ rotate: isMore && moreOpen ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ position: "relative", zIndex: 1, display: "flex" }}>
                  <Icon size={20} style={{ color: active ? C.primary : C.muted, transition: "color 0.15s" }} />
                </motion.div>
              </div>
              <span style={{ fontSize: "9px", color: active ? C.primary : C.muted, fontWeight: active ? 600 : 400, letterSpacing: "0.02em", transition: "color 0.15s" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ─── Appointments List View ─────────────────────────────────────────────── */

export function BarberAppointmentsList({ barberId, appointments, onAction, onNewBooking }) {
  const today = todayStr();
  const upcoming = appointments
    .filter(a => a.barberId === barberId && a.status !== "cancelled" && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const byDate = upcoming.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  const dateGroups = Object.entries(byDate);

  if (dateGroups.length === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.2 }}>✂</div>
        <div style={{ fontSize: "13px", color: C.secondary, marginBottom: "16px" }}>Yaklaşan randevu yok</div>
        <button
          onClick={onNewBooking}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: C.primary, border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", color: "#fff", cursor: "pointer", fontWeight: 600 }}
        >
          <Plus size={14} /> Randevu Ekle
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Yaklaşan Randevular · {upcoming.length}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {dateGroups.map(([dateStr, appts]) => {
          const label = dateStr === today ? "Bugün" : new Date(dateStr + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
          return (
            <div key={dateStr}>
              <div style={{ fontSize: "11px", color: dateStr === today ? C.primary : C.secondary, fontWeight: 600, letterSpacing: "0.05em", marginBottom: "8px", textTransform: dateStr === today ? "uppercase" : "none" }}>
                {label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {appts.map((appt) => {
                  const sc = ALL_STATUS[appt.status] ?? ALL_STATUS.pending;
                  return (
                    <div key={appt.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ textAlign: "center", minWidth: "40px", flexShrink: 0 }}>
                          <div style={{ fontSize: "14px", color: C.primary, fontWeight: 700, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{appt.time}</div>
                          <div style={{ fontSize: "9px", color: C.muted, marginTop: "2px" }}>{appt.duration}dk</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client}</div>
                          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "1px" }}>{appt.service}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                          <span style={{ fontSize: "13px", color: C.primary, fontWeight: 600 }}>₺{(appt.price || 0).toLocaleString()}</span>
                          <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "4px", background: sc.bg, color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                        </div>
                      </div>
                      {!["completed", "cancelled", "noshow"].includes(appt.status) && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                          {FLOW.filter(f => f.key !== appt.status).slice(0, 3).map(f => (
                            <button
                              key={f.key}
                              onClick={() => onAction(appt.id, f.key)}
                              style={{ flex: 1, minHeight: "36px", borderRadius: "7px", background: "none", border: `1px solid ${C.border}`, fontSize: "11px", color: C.secondary, cursor: "pointer" }}
                              onMouseEnter={e => { e.currentTarget.style.background = f.bg; e.currentTarget.style.color = f.color; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.secondary; }}
                            >
                              {f.shortLabel}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Floating Action Button ─────────────────────────────────────────────── */

function BarberFAB({ onNewBooking }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={onNewBooking}
      className="fixed z-35"
      style={{
        bottom: "calc(76px + env(safe-area-inset-bottom))",
        right: "16px",
        width: "56px", height: "56px",
        background: `linear-gradient(135deg, ${C.primary} 0%, #111111 100%)`,
        border: "none", borderRadius: "18px",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 24px rgba(17,17,17,0.35), 0 2px 8px rgba(17,17,17,0.15)",
        zIndex: 35,
      }}
      aria-label="Yeni randevu ekle"
    >
      <Plus size={24} style={{ color: "#fff" }} />
    </motion.button>
  );
}

/* ─── Customers View ─────────────────────────────────────────────────────── */

export function BarberCustomersView({ barberId, appointments, onNewBooking }) {
  const [search, setSearch] = useState("");

  const customerMap = appointments
    .filter(a => a.barberId === barberId && a.status !== "cancelled")
    .reduce((acc, a) => {
      const key = a.client;
      if (!acc[key]) acc[key] = { name: a.client, phone: a.phone || "", visits: [], totalSpent: 0 };
      acc[key].visits.push(a);
      if (a.status === "completed") acc[key].totalSpent += a.price || 0;
      return acc;
    }, {});

  const customers = Object.values(customerMap)
    .map(c => ({
      ...c,
      lastVisit: [...c.visits].sort((a, b) => b.date.localeCompare(a.date))[0],
      completedCount: c.visits.filter(v => v.status === "completed").length,
    }))
    .sort((a, b) => (b.lastVisit?.date || "").localeCompare(a.lastVisit?.date || ""))
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  const initials = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hue      = (name) => name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  const today    = todayStr();

  return (
    <div>
      {/* Header + search */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Müşteriler · {Object.keys(customerMap).length}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "0 12px", height: "44px" }}>
          <Users size={13} style={{ color: C.muted, flexShrink: 0 }} />
          <input
            placeholder="İsim veya telefon ara…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: C.primary, caretColor: C.primary }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {customers.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.2 }}>👤</div>
          <div style={{ fontSize: "13px", color: C.secondary }}>
            {search ? "Eşleşen müşteri bulunamadı" : "Henüz müşteri yok"}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {customers.map((c) => {
          const h = hue(c.name);
          const lastAppt = c.lastVisit;
          const isRegular = c.completedCount >= 3;
          const isNew = lastAppt && lastAppt.date >= today;
          return (
            <div
              key={c.name}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 16px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Avatar */}
                <div style={{
                  width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                  background: `hsl(${h}, 28%, 18%)`,
                  border: `1px solid hsl(${h}, 28%, 26%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 700, color: `hsl(${h}, 60%, 68%)`,
                }}>
                  {initials(c.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "14px", color: C.primary, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </span>
                    {isRegular && (
                      <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(34,197,94,0.12)", color: "#15803D", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 700, flexShrink: 0 }}>
                        SADIK
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {c.phone && (
                      <span style={{ fontSize: "11px", color: C.secondary, fontFamily: "'DM Mono', monospace" }}>{c.phone}</span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "14px", color: C.primary, fontWeight: 700 }}>₺{c.totalSpent.toLocaleString()}</div>
                  <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>{c.completedCount} ziyaret</div>
                </div>
              </div>

              {/* Last appointment + quick call */}
              {lastAppt && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${C.border}` }}>
                  <div>
                    <span style={{ fontSize: "10px", color: C.muted }}>Son ziyaret: </span>
                    <span style={{ fontSize: "10px", color: C.secondary }}>
                      {lastAppt.date} · {lastAppt.service}
                    </span>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", fontSize: "11px", color: "#2563EB", textDecoration: "none", fontWeight: 600 }}
                    >
                      <Phone size={11} /> Ara
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Bottom Navigation (mobile only) ───────────────────────────────────── */
const BOTTOM_TABS = [
  { id: "dashboard",    label: "Anasayfa",   icon: LayoutDashboard },
  { id: "appointments", label: "Randevular", icon: List            },
  { id: "schedule",     label: "Takvim",     icon: CalendarDays    },
  { id: "customers",    label: "Müşteriler", icon: Users           },
  { id: "__more",       label: "Daha Fazla", icon: MoreHorizontal  },
];

function BottomNav({ view, setView, moreSheet, setMoreSheet }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${C.border}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="grid grid-cols-5 h-[56px]">
        {BOTTOM_TABS.map(({ id, label, icon: Icon }) => {
          const isMore = id === "__more";
          const active = isMore ? moreSheet : view === id;
          return (
            <button
              key={id}
              onClick={() => {
                if (isMore) { setMoreSheet((o) => !o); }
                else { setView(id); setMoreSheet(false); }
              }}
              className="flex flex-col items-center justify-center gap-[3px] transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <Icon
                size={20}
                style={{ color: active ? C.primary : C.muted, transition: "color 0.15s" }}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span style={{ fontSize: "9px", color: active ? C.primary : C.muted, fontWeight: active ? 600 : 400, letterSpacing: "0.01em", transition: "color 0.15s" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SheetItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
      style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      onTouchStart={(e) => { e.currentTarget.style.background = C.surface; }}
      onTouchEnd={(e) => { e.currentTarget.style.background = "none"; }}
    >
      <Icon size={17} style={{ color: danger ? "#111111" : C.secondary, flexShrink: 0 }} />
      <span style={{ fontSize: "15px", color: danger ? "#111111" : C.primary }}>{label}</span>
    </button>
  );
}
