"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { barbers, services, workingHours } from "@/lib/data";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useAuth } from "@/contexts/AuthContext";
import ManualBookingModal from "@/components/admin/ManualBookingModal";
import Link from "next/link";
import {
  Plus, LogOut, ChevronLeft, ChevronRight, ExternalLink,
  Phone, UserCheck, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight,
  CalendarDays, List, User, X, LayoutDashboard, Users, MoreHorizontal,
} from "lucide-react";

const C = {
  bg:       "#08080c",
  card:     "#0f0f15",
  cardHi:   "#13131a",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(255,255,255,0.12)",
  surface:  "#17171f",
  primary:  "#f0ede8",
  secondary:"#6b6870",
  muted:    "#2e2d35",
  red:      "#CC1A1A",
};

// Arrival-focused status config — workflow order: pending→confirmed→in-progress→completed
export const FLOW = [
  { key: "confirmed",    label: "Onaylandı",  shortLabel: "Onay",   color: "#22c55e", bg: "rgba(34,197,94,0.12)"   },
  { key: "in-progress",  label: "Koltuğa Aldı", shortLabel: "Devam", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  { key: "completed",    label: "Tamamlandı", shortLabel: "Tamam",  color: "#6b6870", bg: "rgba(107,104,112,0.12)" },
  { key: "noshow",       label: "Gelmedi",    shortLabel: "Gelmedi",color: "#CC1A1A", bg: "rgba(204,26,26,0.12)"   },
];

export const ALL_STATUS = {
  pending:       { label: "Bekleniyor",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)"   },
  confirmed:     { label: "Onaylandı",     color: "#22c55e", bg: "rgba(34,197,94,0.1)"    },
  "in-progress": { label: "Koltuğa Aldı", color: "#60a5fa", bg: "rgba(96,165,250,0.1)"   },
  completed:     { label: "Tamamlandı",   color: "#6b6870", bg: "rgba(107,104,112,0.1)"  },
  noshow:        { label: "Gelmedi",      color: "#CC1A1A", bg: "rgba(204,26,26,0.1)"    },
  cancelled:     { label: "İptal",        color: "#52525b", bg: "rgba(82,82,91,0.1)"     },
};

function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export function isToday(dateStr) {
  return dateStr === new Date().toISOString().split("T")[0];
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
  const isActive = appt.status === "in-progress";

  return (
    <motion.div
      layout
      style={{
        background: isActive ? "#131320" : C.card,
        border: `1px solid ${isActive ? "rgba(96,165,250,0.25)" : C.border}`,
        borderLeft: `4px solid ${sc.color}`,
        borderRadius: "12px",
        padding: "16px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isActive && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #60a5fa, transparent)", opacity: 0.6 }} />
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
          border: `1px solid ${isNext ? C.borderHi : C.border}`,
          borderLeft: `3px solid ${isNext ? sc.color : isDone ? C.muted : C.border}`,
          borderRadius: "10px",
          padding: "14px 16px",
          cursor: isDone ? "default" : "pointer",
          opacity: isPast && isDone ? 0.55 : 1,
          transition: "all 0.15s",
          position: "relative",
        }}
        onMouseEnter={e => { if (!isDone) { e.currentTarget.style.borderLeftColor = sc.color; e.currentTarget.style.background = C.cardHi; }}}
        onMouseLeave={e => { if (!isDone) { e.currentTarget.style.borderLeftColor = isNext ? sc.color : C.border; e.currentTarget.style.background = isNext ? C.cardHi : C.card; }}}
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
                <span style={{ marginLeft: "6px", fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", fontWeight: 600, verticalAlign: "middle" }}>TEL</span>
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
  const confirmed  = dayAppts.filter(a => ["confirmed", "in-progress"].includes(a.status)).length;
  const completed  = dayAppts.filter(a => a.status === "completed").length;
  const revenue    = dayAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0);
  const nextAppt   = isToday_ ? dayAppts.find(a => a.time >= now && ["pending", "confirmed", "in-progress"].includes(a.status)) : null;
  const activeAppt = isToday_ ? dayAppts.find(a => a.status === "in-progress") : null;
  const displayNext = activeAppt ?? nextAppt;

  return (
    <>
      {/* Stats strip */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" style={{ marginBottom: "16px" }}>
        {[
          { label: "Toplam",   value: dayAppts.length,    color: C.primary,   span: false },
          { label: "Onaylı",   value: confirmed,           color: "#22c55e",   span: false },
          { label: "Bekliyor", value: pending,             color: "#f59e0b",   span: false },
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
            {activeAppt ? "Şu An" : "Sonraki Randevu"}
          </div>
          <NextAppointmentCard appt={displayNext} onAction={updateStatus} />
        </div>
      )}

      {/* Pending banner */}
      {pending > 0 && isToday_ && (
        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 500 }}>{pending} randevu onay bekliyor</span>
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
            const isPast = isToday_ && appt.time < now && appt.status !== "in-progress";
            const isNext = appt.id === displayNext?.id;
            return <TimelineItem key={appt.id} appt={appt} isNext={isNext} isPast={isPast} onAction={updateStatus} index={i} />;
          })}
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BarberDashboardClient({ barberId }) {
  const router = useRouter();
  const { role, logout, loaded: authLoaded } = useAuth();
  const { appointments, updateStatus } = useAppointments();
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [view, setView]       = useState("dashboard");
  const [moreOpen, setMoreOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tick, setTick]     = useState(0);

  // Refresh time every minute for "next appointment" accuracy
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const barber = barbers.find(b => b.id === barberId);

  useEffect(() => {
    if (!authLoaded) return;
    if (!role) { router.replace("/barber"); return; }
    if (role !== "admin" && role !== barberId) router.replace(`/barber/${role}`);
  }, [role, authLoaded, barberId, router]);

  if (!barber) return null;

  const todayStr       = new Date().toISOString().split("T")[0];
  const viewDate       = view === "dashboard" ? todayStr : date;
  const viewing        = viewDate;
  const isViewingToday = isToday(viewing);

  const dayAppts = appointments
    .filter(a => a.barberId === barberId && a.date === viewing && a.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));

  const now = nowTimeStr();

  const nextAppt = isViewingToday
    ? dayAppts.find(a => a.time >= now && ["pending", "confirmed", "in-progress"].includes(a.status))
    : null;

  const activeAppt = isViewingToday
    ? dayAppts.find(a => a.status === "in-progress")
    : null;

  const displayNext = activeAppt ?? nextAppt;

  // Stats
  const pending   = dayAppts.filter(a => a.status === "pending").length;
  const confirmed = dayAppts.filter(a => ["confirmed", "in-progress"].includes(a.status)).length;
  const completed = dayAppts.filter(a => a.status === "completed").length;
  const noshow    = dayAppts.filter(a => a.status === "noshow").length;
  const revenue   = dayAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0);
  const wh        = workingHours[barberId] ?? { start: 9, end: 18 };
  const totalSlots = (wh.end - wh.start) * 2; // 30min slots
  const freeSlots  = Math.max(0, totalSlots - dayAppts.length * 1.5 | 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, overflowX: "hidden" }}>

      {/* ── Topbar ── */}
      <div style={{ minHeight: "56px", background: C.card, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {role === "admin" && (
            <button
              onClick={() => router.push("/admin")}
              style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: C.secondary, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <ChevronLeft size={13} /> Admin
            </button>
          )}
          {role === "admin" && <div style={{ width: "1px", height: "16px", background: C.border }} />}
          <div style={{ width: "28px", height: "28px", background: `linear-gradient(135deg, ${C.red}, #9a1212)`, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}>
            {barber.avatar}
          </div>
          <div>
            <div style={{ fontSize: "13px", color: C.primary, fontWeight: 600, lineHeight: 1.2 }}>{barber.name}</div>
            <div style={{ fontSize: "10px", color: C.red, letterSpacing: "0.06em", textTransform: "uppercase" }}>{barber.title.tr}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="hidden sm:flex items-center gap-1.5"
            style={{ background: C.red, color: "#fff", border: "none", borderRadius: "8px", padding: "0 16px", height: "44px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            <Plus size={15} /> Randevu Ekle
          </button>
          <Link
            href="/"
            className="hidden sm:flex"
            style={{ width: "44px", height: "44px", background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", alignItems: "center", justifyContent: "center", color: C.secondary, textDecoration: "none" }}
            title="Siteyi Görüntüle"
          >
            <ExternalLink size={15} />
          </Link>
          <button
            onClick={() => { logout(); router.push("/barber"); }}
            className="hidden sm:flex"
            style={{ width: "44px", height: "44px", background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}
            title="Çıkış Yap"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "16px 16px 0", paddingBottom: "calc(88px + env(safe-area-inset-bottom))" }}>

        {/* ── Today header (Dashboard tab only) ── */}
        {view === "dashboard" && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.015em" }}>
              {formatDateLong(todayStr)}
              <span style={{ marginLeft: "10px", fontSize: "10px", color: C.red, fontWeight: 700, letterSpacing: "0.1em", verticalAlign: "middle", textTransform: "uppercase" }}>Bugün</span>
            </div>
            <div style={{ fontSize: "11px", color: C.secondary, marginTop: "3px" }}>
              {wh.start}:00 – {wh.end}:00 · {dayAppts.length} randevu
            </div>
          </div>
        )}

        {/* ── Date nav (Takvim tab only) ── */}
        {view === "schedule" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "20px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "18px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {formatDateLong(viewing)}
              {isViewingToday && <span style={{ marginLeft: "8px", fontSize: "10px", color: C.red, fontWeight: 600, letterSpacing: "0.08em", verticalAlign: "middle" }}>BUGÜN</span>}
            </div>
            <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>
              {wh.start}:00 – {wh.end}:00 çalışma saati
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <button onClick={() => setDate(d => addDays(d, -1))} style={{ width: "44px", height: "44px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
              <ChevronLeft size={16} />
            </button>
            {!isViewingToday && (
              <button onClick={() => setDate(todayStr)} style={{ height: "44px", padding: "0 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "12px", color: C.secondary, cursor: "pointer" }}>
                Bugün
              </button>
            )}
            <button onClick={() => setDate(d => addDays(d, 1))} style={{ width: "44px", height: "44px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        )}

        {/* ── Schedule views: dashboard + takvim ── */}
        {(view === "dashboard" || view === "schedule") && (
          <>
            {/* Stat pills */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" style={{ marginBottom: "20px" }}>
              {[
                { label: "Toplam",   value: dayAppts.length,    color: C.primary,   span: false },
                { label: "Onaylı",   value: confirmed,           color: "#22c55e",   span: false },
                { label: "Bekliyor", value: pending,             color: "#f59e0b",   span: false },
                { label: "Tamam",    value: completed,           color: C.secondary, span: false },
                { label: "Kasa",     value: `₺${revenue.toLocaleString()}`, color: C.primary, span: true },
              ].map((s, i) => (
                <div key={i} className={s.span ? "col-span-2 sm:col-span-1" : ""} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: "16px", color: s.color, fontWeight: 600, lineHeight: 1, marginBottom: "3px" }}>{s.value}</div>
                  <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Next / Active appointment (today only) */}
            {isViewingToday && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
                  {activeAppt ? "Şu An" : "Sonraki Randevu"}
                </div>
                <NextAppointmentCard appt={displayNext} onAction={updateStatus} />
              </div>
            )}

            {/* Pending banner */}
            {pending > 0 && isViewingToday && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.2)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={14} style={{ color: "#f59e0b", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 500 }}>
                    {pending} randevu onay bekliyor
                  </span>
                </div>
                <span style={{ fontSize: "11px", color: C.secondary }}>Aşağıdan güncelleyebilirsiniz</span>
              </motion.div>
            )}

            {/* Timeline */}
            <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
              {isViewingToday ? "Bugünün Programı" : "Günün Programı"} · {dayAppts.length} randevu
            </div>
            {dayAppts.length === 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "48px 24px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", marginBottom: "10px", opacity: 0.2 }}>✂</div>
                <div style={{ fontSize: "13px", color: C.secondary, marginBottom: "14px" }}>Bu gün için randevu yok</div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: `1px solid rgba(204,26,26,0.3)`, borderRadius: "6px", padding: "7px 16px", fontSize: "12px", color: C.red, cursor: "pointer" }}
                >
                  <Plus size={12} /> Randevu Ekle
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {dayAppts.map((appt, i) => {
                  const isPast = isViewingToday && appt.time < now && !["in-progress"].includes(appt.status);
                  const isNext = appt.id === displayNext?.id;
                  return (
                    <TimelineItem key={appt.id} appt={appt} isNext={isNext} isPast={isPast} onAction={updateStatus} index={i} />
                  );
                })}
              </div>
            )}

            {/* Day summary */}
            {isViewingToday && dayAppts.length > 0 && (
              <div style={{ marginTop: "24px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px 18px" }}>
                <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "12px" }}>Gün Özeti</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "Tamamlanan",  value: completed,                      color: C.secondary },
                    { label: "Kazanç",      value: `₺${revenue.toLocaleString()}`, color: C.primary   },
                    { label: "Gelmedi",     value: noshow,   color: noshow > 0 ? "#f87171" : C.muted  },
                    { label: "Müsait Slot", value: `~${freeSlots} slot`,            color: C.muted     },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: C.secondary }}>{s.label}</span>
                      <span style={{ fontSize: "13px", color: s.color, fontWeight: 500 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Randevular view ── */}
        {view === "appointments" && (
          <BarberAppointmentsList barberId={barberId} appointments={appointments} onAction={updateStatus} onNewBooking={() => setShowModal(true)} />
        )}

        {/* ── Müşteriler view ── */}
        {view === "customers" && (
          <BarberCustomersView barberId={barberId} appointments={appointments} onNewBooking={() => setShowModal(true)} />
        )}

      </div>

      {/* Floating action button — always visible */}
      <BarberFAB onNewBooking={() => setShowModal(true)} />

      <BarberBottomNav
        view={view}
        setView={setView}
        moreOpen={moreOpen}
        setMoreOpen={setMoreOpen}
        barber={barber}
        onLogout={() => { logout(); router.push("/barber"); }}
      />

      {showModal && (
        <ManualBookingModal
          defaultBarberId={barberId}
          initialDate={date}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
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
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
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
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: C.muted }} />
            </div>

            {/* Barber mini card */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{
                width: "44px", height: "44px", flexShrink: 0,
                background: `linear-gradient(135deg, ${C.red}, #9a1212)`,
                borderRadius: "12px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "#fff",
              }}>
                {barber?.avatar}
              </div>
              <div>
                <div style={{ fontSize: "14px", color: C.primary, fontWeight: 600 }}>{barber?.name}</div>
                <div style={{ fontSize: "10px", color: C.red, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "2px" }}>{barber?.title?.tr}</div>
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
                  <LogOut size={16} style={{ color: "#f87171" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "13px", color: "#f87171", fontWeight: 500 }}>Çıkış Yap</div>
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
                    style={{ position: "absolute", inset: "-6px -10px", background: `${C.red}18`, borderRadius: "10px" }}
                    transition={{ type: "spring", damping: 28, stiffness: 380 }}
                  />
                )}
                <motion.div animate={{ rotate: isMore && moreOpen ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ position: "relative", zIndex: 1, display: "flex" }}>
                  <Icon size={20} style={{ color: active ? C.red : C.muted, transition: "color 0.15s" }} />
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
  const today = new Date().toISOString().split("T")[0];
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
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: C.red, border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", color: "#fff", cursor: "pointer", fontWeight: 600 }}
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
              <div style={{ fontSize: "11px", color: dateStr === today ? C.red : C.secondary, fontWeight: 600, letterSpacing: "0.05em", marginBottom: "8px", textTransform: dateStr === today ? "uppercase" : "none" }}>
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
        background: `linear-gradient(135deg, ${C.red} 0%, #9a1212 100%)`,
        border: "none", borderRadius: "18px",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 24px rgba(204,26,26,0.55), 0 2px 8px rgba(0,0,0,0.4)",
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
  const today    = new Date().toISOString().split("T")[0];

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
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "13px", color: C.primary, caretColor: C.red }}
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
                      <span style={{ fontSize: "8px", padding: "1px 5px", borderRadius: "3px", background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)", fontWeight: 700, flexShrink: 0 }}>
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
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", fontSize: "11px", color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}
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
