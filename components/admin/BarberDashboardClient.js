"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { todayStr, toDateStr } from "@/lib/utils";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import ManualBookingModal from "@/components/admin/ManualBookingModal";
import WalkInModal from "@/components/admin/WalkInModal";
import ImageCropModal from "@/components/shared/ImageCropModal";
import SubscriptionBanner from "@/components/admin/SubscriptionBanner";
import DashboardTopbar from "@/components/admin/DashboardTopbar";
import { useLang } from "@/contexts/LanguageContext";
import Link from "next/link";
import {
  Plus, LogOut, ChevronLeft, ChevronRight, ExternalLink,
  Clock, AlertCircle, UserCheck, UserX,
  CalendarDays, List, X, LayoutDashboard, Users, MoreHorizontal,
  Settings, Eye, EyeOff, Save, Loader2, AtSign, Star, Camera, Trash2, MessageSquare,
} from "lucide-react";

import { C, SHADOW } from "@/lib/adminTheme";
import { DSPageLoader, DSEmptyState } from "@/components/ds";

// Re-export constants and utilities from their canonical locations so that
// existing import paths (e.g. AdminDashboard.js) continue to work unchanged.
export { FLOW, ALL_STATUS } from "@/components/admin/barber/statusConstants";
export { addDays, isToday, formatDateLong, nowTimeStr } from "@/lib/adminDateUtils";

// Re-export extracted sub-components so external importers keep working.
export { NextAppointmentCard } from "@/components/admin/barber/NextAppointmentCard";
export { TimelineItem }        from "@/components/admin/barber/TimelineItem";
export { BarberDayView }       from "@/components/admin/barber/BarberDayView";
export { BarberAppointmentsList } from "@/components/admin/barber/BarberAppointmentsList";
export { BarberCustomersView } from "@/components/admin/barber/BarberCustomersView";

// Local imports for use inside this file
import { FLOW, ALL_STATUS } from "@/components/admin/barber/statusConstants";
import { addDays, isToday, formatDateLong, nowTimeStr } from "@/lib/adminDateUtils";
import { NextAppointmentCard } from "@/components/admin/barber/NextAppointmentCard";
import { TimelineItem }        from "@/components/admin/barber/TimelineItem";
import { BarberAppointmentsList } from "@/components/admin/barber/BarberAppointmentsList";
import { BarberCustomersView } from "@/components/admin/barber/BarberCustomersView";

// Extracted sub-components are now imported above and re-exported for backward compat.

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BarberDashboardClient({ barberId: barberSlug, shopSlug: shopSlugProp }) {
  const router = useRouter();
  const { role, user, logout, loaded: authLoaded } = useAuth();
  const { appointments, updateStatus, refresh } = useAppointments();
  const { lang, setLang } = useLang();
  const [date, setDate]       = useState(todayStr());
  const [view, setView]       = useState("dashboard");
  const [moreSheet, setMoreSheet] = useState(false);
  const [breakModal, setBreakModal] = useState(false);
  useBodyScrollLock(moreSheet || breakModal);
  const [showModal, setShowModal] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [barberData, setBarberData] = useState(null);
  // Monthly earnings come from /api/admin/stats which auto-scopes to the
  // logged-in barber. Local appointments context only fetches 200 most recent
  // rows so a full-month sum can't be derived client-side reliably.
  const [monthStats, setMonthStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
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
    if (!authLoaded || !user?.barberId) return;
    const load = () => apiFetch("/api/admin/stats").then(setMonthStats).catch(() => {});
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => clearInterval(id);
  }, [authLoaded, user?.barberId]);

  const fetchAlerts = useCallback(() => {
    if (!authLoaded || !role) return;
    apiFetch("/api/barber/alerts").then(setAlerts).catch(() => {});
  }, [authLoaded, role]);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

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
  // Pending across all days — drives the topbar bell badge.
  const allPending = appointments.filter(a =>
    (realBarberId ? a.barberId === realBarberId : a.barberId === barberSlug) && a.status === "pending"
  ).length;
  const remainingToday = isViewingToday
    ? dayAppts.filter(a => a.status !== "completed" && a.status !== "noshow" && a.time >= now).length
    : 0;
  const isSelf = user?.barber?.slug === barberSlug;

  // Active break: today's one-off break whose [start, end] contains now.
  const activeBreak = (() => {
    const breaks = barberData?.breaks ?? [];
    if (!breaks.length) return null;
    return breaks.find(b => b.date === today && b.start <= now && now < b.end) ?? null;
  })();

  async function startBreak(minutes) {
    try {
      const brk = await apiFetch("/api/barber/me/break", { method: "POST", body: JSON.stringify({ minutes }) });
      setBarberData(prev => prev ? { ...prev, breaks: [...(prev.breaks ?? []), brk] } : prev);
      setBreakModal(false);
    } catch (err) {
      alert(err.message || "Mola başlatılamadı");
    }
  }
  async function endBreak() {
    try {
      await apiFetch("/api/barber/me/break", { method: "DELETE" });
      setBarberData(prev => prev ? { ...prev, breaks: (prev.breaks ?? []).filter(b => b.date !== today) } : prev);
    } catch (err) {
      alert(err.message || "Mola bitirilemedi");
    }
  }

  async function dismissAlert(alertId, action) {
    try {
      await apiFetch("/api/barber/alerts", { method: "POST", body: JSON.stringify({ alertId, action }) });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      refresh(); // update appointment status in timeline (ARRIVAL_CHECK → IN_PROGRESS or NOSHOW)
    } catch (err) {
      alert(err.message || "İşlem tamamlanamadı");
    }
  }

  async function toggleAvailability() {
    if (!isSelf) return;
    const next = !barber.available;
    setBarberData(prev => prev ? { ...prev, available: next } : prev);
    try {
      await apiFetch("/api/barber/me/availability", { method: "POST", body: JSON.stringify({ available: next }) });
    } catch (err) {
      setBarberData(prev => prev ? { ...prev, available: !next } : prev);
      alert(err.message || "Durum güncellenemedi");
    }
  }
  const confirmed = dayAppts.filter(a => a.status === "confirmed").length;
  const completed = dayAppts.filter(a => a.status === "completed").length;
  const noshow    = dayAppts.filter(a => a.status === "noshow").length;
  // Barber-take = commission share + 100% of tips. Falls back to legacy price
  // for pre-Phase-2 rows so historic totals stay non-zero.
  const revenue   = dayAppts
    .filter(a => a.status === "completed")
    .reduce((s, a) => s + ((a.barberAmount ?? a.price) || 0) + (a.tipAmount || 0), 0);
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
    return { date: d, count: appts.length, revenue: appts.reduce((s, a) => s + ((a.barberAmount ?? a.price) || 0) + (a.tipAmount || 0), 0) };
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
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30 w-[232px]"
        style={{ background: C.card, borderRight: `1px solid ${C.border}` }}>

        {/* Logo / Barber identity */}
        <div style={{ padding: "22px 22px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
            <div style={{ width: "38px", height: "38px", background: C.primary, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--makas-bg)", flexShrink: 0, boxShadow: SHADOW.card }}>
              {barber.avatar}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontSize: "15px", color: C.primary, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>{barber.nameTr ?? barber.name}</div>
              <div className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "2px", fontWeight: 500 }}>{barber.titleTr ?? barber.title?.tr ?? "Berber"}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
          {SIDEBAR_NAV.map(({ id, label, icon: Icon }) => {
            const active = view === id;
            return (
              <button key={id} onClick={() => setView(id)}
                className="w-full flex items-center gap-3"
                style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: "2px", background: active ? C.surface : "transparent", border: "1px solid transparent", textAlign: "left", transition: "background 0.14s ease, color 0.14s ease" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.surface; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.75} style={{ color: active ? C.primary : C.muted, flexShrink: 0 }} />
                <span style={{ fontSize: "13.5px", color: active ? C.primary : C.secondary, fontWeight: active ? 600 : 500, letterSpacing: "-0.005em" }}>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: "12px 12px 18px", borderTop: `1px solid ${C.border}` }}>
          {role === "admin" && (
            <button onClick={() => router.push(user?.shop?.slug ? `/${user.shop.slug}/admin` : "/admin")}
              className="w-full flex items-center gap-3"
              style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: "2px", background: "transparent", border: "1px solid transparent", transition: "background 0.14s ease" }}
              onMouseEnter={e => { e.currentTarget.style.background = C.surface; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              <ChevronLeft size={16} style={{ color: C.muted }} />
              <span style={{ fontSize: "13.5px", color: C.secondary, fontWeight: 500 }}>Admin Paneli</span>
            </button>
          )}
          <Link href={user?.shop?.slug ? `/${user.shop.slug}` : "/"}
            className="w-full flex items-center gap-3"
            style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: "2px", display: "flex", textDecoration: "none", transition: "background 0.14s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.surface; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <ExternalLink size={16} style={{ color: C.muted }} />
            <span style={{ fontSize: "13.5px", color: C.secondary, fontWeight: 500 }}>Siteyi Gör</span>
          </Link>
          <button onClick={() => { { const s = user?.shop?.slug; loggingOut.current = true; logout(); router.push(s ? `/${s}/barber` : "/superadmin/login"); }; }}
            className="w-full flex items-center gap-3"
            style={{ padding: "10px 12px", borderRadius: "10px", background: "transparent", border: "1px solid transparent", transition: "background 0.14s ease" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(220,38,38,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <LogOut size={16} style={{ color: "#DC2626" }} />
            <span style={{ fontSize: "13.5px", color: "#DC2626", fontWeight: 500 }}>Çıkış Yap</span>
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
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="fixed left-0 right-0 bottom-0 z-50 lg:hidden rounded-t-2xl"
              style={{ background: C.card, border: `1px solid ${C.border}`, paddingBottom: "env(safe-area-inset-bottom, 16px)", maxHeight: "85dvh", overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: C.dim }} />
              </div>
              {/* Identity */}
              <div style={{ padding: "12px 20px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", background: C.primary, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "var(--makas-bg)", flexShrink: 0 }}>{barber.avatar}</div>
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

        <DashboardTopbar
          brand={{
            href: user?.shop?.slug ? `/${user.shop.slug}` : "/",
            label: user?.shop?.name ?? barber.nameTr ?? barber.name ?? "Makas",
            initial: (user?.shop?.name ?? barber.nameTr ?? barber.name ?? "M")[0].toUpperCase(),
          }}
          lang={lang}
          onLangToggle={() => setLang(lang === "tr" ? "en" : "tr")}
          notifications={{
            badge: allPending,
            onClick: () => setView("appointments"),
            title: "Bekleyen randevular",
          }}
          userMenu={{
            initials: (barber.nameTr ?? barber.name ?? "B").split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase(),
            statusDot: isSelf && barberData ? { available: barber.available } : null,
            headerName: barber.nameTr ?? barber.name,
            headerRole: barber.titleTr ?? barber.title?.tr ?? "Berber",
            items: [
              ...(isSelf && barberData ? [{
                label: barber.available ? "Müsait" : "Müsait Değil",
                action: toggleAvailability,
                right: barber.available ? "Kapat" : "Aç",
              }] : []),
              ...(isSelf && barberData ? [
                activeBreak
                  ? { icon: Clock, label: `Molada · ${activeBreak.end}'a kadar`, action: endBreak, right: "Bitir", rightColor: "#DC2626" }
                  : { icon: Clock, label: "Mola Başlat", action: () => setBreakModal(true) }
              ] : []),
              { label: "↻ Yenile", action: refresh },
              { icon: Settings, label: "Profil", action: () => setView("profil") },
              ...(role === "admin" ? [{
                icon: ChevronLeft,
                label: "Admin Paneli",
                action: () => router.push(user?.shop?.slug ? `/${user.shop.slug}/admin` : "/admin"),
              }] : []),
              { divider: true },
              {
                icon: LogOut,
                label: "Çıkış Yap",
                danger: true,
                action: () => {
                  const s = user?.shop?.slug;
                  loggingOut.current = true;
                  logout();
                  router.push(s ? `/${s}/barber` : "/superadmin/login");
                },
              },
            ],
          }}
        />

        {/* Today summary strip — mobile only; one-glance daily status */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-2 overflow-x-auto" style={{ borderBottom: `1px solid ${C.border}`, background: `${C.surface}80`, fontSize: "11px", color: C.secondary, letterSpacing: "0.01em", scrollbarWidth: "none" }}>
          <span><strong style={{ color: C.primary, fontWeight: 600 }}>₺{revenue.toLocaleString("tr-TR")}</strong> bugün</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span><strong style={{ color: C.primary, fontWeight: 600 }}>{remainingToday}</strong> randevu kaldı</span>
          {pending > 0 && (<>
            <span style={{ opacity: 0.4 }}>·</span>
            <span style={{ color: "#B45309" }}>{pending} onay bekliyor</span>
          </>)}
          {activeBreak && (
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "10px", background: "rgba(180,83,9,0.12)", color: "#B45309", fontWeight: 600 }}>
              <Clock size={11} /> Mola {activeBreak.end}'a kadar
            </span>
          )}
        </div>

        {/* Break duration modal */}
        <AnimatePresence>
          {breakModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70]" style={{ background: "rgba(17,17,17,0.5)", backdropFilter: "blur(3px)" }}
                onClick={() => setBreakModal(false)} />
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-1/2 top-1/2 z-[71] w-[92vw] max-w-[360px]"
                style={{ transform: "translate(-50%, -50%)", background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px", boxShadow: "0 24px 60px rgba(17,17,17,0.25)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: C.primary, margin: 0 }}>Mola Başlat</h3>
                  <button onClick={() => setBreakModal(false)} aria-label="Kapat"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", color: C.secondary, cursor: "pointer" }}>
                    <X size={16} />
                  </button>
                </div>
                <p style={{ fontSize: "12px", color: C.muted, margin: "0 0 14px" }}>Süreyi seç; o süre boyunca yeni randevu alınmaz.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[15, 30, 45, 60, 90, 120].map(min => (
                    <button key={min} onClick={() => startBreak(min)}
                      style={{ padding: "12px 8px", borderRadius: "10px", border: `1px solid ${C.border}`, background: C.surface, color: C.primary, fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.primary; }}
                      onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border; }}>
                      <Clock size={13} /> {min < 60 ? `${min} dk` : min === 60 ? "1 saat" : `${min / 60} saat`}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <SubscriptionBanner shop={user?.shop} />

        {/* Page content — extra bottom padding so content clears mobile bottom nav */}
        <div className="px-4 pt-5 pb-24 lg:px-7 lg:pt-7 lg:pb-10">

        {/* Page header — left: title/date, right: primary CTA (matches Admin) */}
        <div style={{ marginBottom: "28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {(view === "dashboard" || view === "schedule") && (
              <>
                <h1 className="font-display" style={{ fontSize: "clamp(20px, 5vw, 28px)", color: C.primary, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {view === "dashboard" ? formatDateLong(today) : formatDateLong(viewing)}
                  {(view === "dashboard" || isViewingToday) && (
                    <span className="font-mono-custom" style={{ marginLeft: "12px", fontSize: "10px", color: C.primary, fontWeight: 600, letterSpacing: "0.16em", verticalAlign: "middle", textTransform: "uppercase" }}>Bugün</span>
                  )}
                </h1>
                <p className="font-mono-custom" style={{ fontSize: "11px", color: C.muted, marginTop: "4px", letterSpacing: "0.06em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(Math.floor(wh.start/60)).padStart(2,"0")}:{String(wh.start%60).padStart(2,"0")} – {String(Math.floor(wh.end/60)).padStart(2,"0")}:{String(wh.end%60).padStart(2,"0")} · {dayAppts.length} randevu</p>
              </>
            )}
            {view === "appointments" && (
              <>
                <h1 className="font-display" style={{ fontSize: "28px", color: C.primary, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Randevular</h1>
                <p style={{ fontSize: "13px", color: C.secondary, marginTop: "4px" }}>Tüm randevuların listesi</p>
              </>
            )}
            {view === "customers" && (
              <>
                <h1 className="font-display" style={{ fontSize: "28px", color: C.primary, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Müşteriler</h1>
                <p style={{ fontSize: "13px", color: C.secondary, marginTop: "4px" }}>Geçmiş randevu kayıtları</p>
              </>
            )}
            {view === "profil" && (
              <>
                <h1 className="font-display" style={{ fontSize: "28px", color: C.primary, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Profil</h1>
                <p style={{ fontSize: "13px", color: C.secondary, marginTop: "4px" }}>Hesap ve görünüm ayarları</p>
              </>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            {view === "schedule" && (
              <>
                <button onClick={() => setDate(d => addDays(d, -1))} aria-label="Önceki gün" className="transition-colors" style={{ width: "36px", height: "36px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary, boxShadow: SHADOW.card }} onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.primary; }} onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.secondary; }}>
                  <ChevronLeft size={15} />
                </button>
                {!isViewingToday && (
                  <button onClick={() => setDate(today)} className="font-mono-custom transition-colors" style={{ height: "36px", padding: "0 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "9px", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: C.secondary, cursor: "pointer", boxShadow: SHADOW.card }} onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.primary; }} onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.secondary; }}>Bugün</button>
                )}
                <button onClick={() => setDate(d => addDays(d, 1))} aria-label="Sonraki gün" className="transition-colors" style={{ width: "36px", height: "36px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary, boxShadow: SHADOW.card }} onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.primary; }} onMouseLeave={(e) => { e.currentTarget.style.background = C.card; e.currentTarget.style.color = C.secondary; }}>
                  <ChevronRight size={15} />
                </button>
              </>
            )}
            {(view === "dashboard" || view === "schedule" || view === "appointments") && (
              <>
                <button
                  onClick={() => setShowWalkIn(true)}
                  className="transition-colors"
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: C.primary, flexShrink: 0, boxShadow: SHADOW.card }}
                  title="Şimdi gelen müşteriyi kaydet"
                >
                  <Plus size={13} strokeWidth={2.2} />
                  <span className="hidden sm:inline">Walk-in</span>
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="transition-transform"
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: C.primary, border: "none", borderRadius: "9px", cursor: "pointer", fontSize: "12.5px", fontWeight: 600, letterSpacing: "-0.005em", color: "var(--makas-bg)", flexShrink: 0, boxShadow: SHADOW.elevated }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  <Plus size={14} strokeWidth={2.2} />
                  <span className="hidden sm:inline">Yeni Randevu</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Dashboard / Schedule view ── */}
        {(view === "dashboard" || view === "schedule") && (
          <>
            {/* KPI cards row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-5 gap-4" style={{ marginBottom: "28px" }}>
              {[
                { label: "Toplam",   value: dayAppts.length,                   color: C.primary   },
                { label: "Onaylı",   value: confirmed,                          color: "#15803D"   },
                { label: "Bekliyor", value: pending,                            color: "#B45309"   },
                { label: "Tamam",    value: completed,                          color: C.secondary },
                { label: "Bugün Kazanç", value: `₺${revenue.toLocaleString()}`, color: C.primary   },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px 20px", boxShadow: SHADOW.card, transition: "box-shadow 0.18s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = SHADOW.elevated; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = SHADOW.card; }}
                >
                  <div className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "10px" }}>{s.label}</div>
                  <div className="font-display" style={{ fontSize: "28px", color: s.color, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
                </motion.div>
              ))}
            </div>

            {/* 2-column desktop grid */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">

              {/* Left: timeline */}
              <div>
                {/* Arrival check alerts */}
                {alerts.map(alert => (
                  <motion.div key={alert.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.22)", borderRadius: "12px", padding: "14px 18px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <AlertCircle size={15} style={{ color: "#2563EB", flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: "13px", color: "#1D4ED8", fontWeight: 600 }}>{alert.appointment?.client?.name}</span>
                        {alert.appointment?.service?.nameTr && (
                          <span style={{ fontSize: "12px", color: "#3B82F6", marginLeft: "6px" }}>{alert.appointment.service.nameTr}</span>
                        )}
                        <span style={{ fontSize: "11px", color: "#3B82F6", display: "block" }}>Randevu başladı — müşteri geldi mi?</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button onClick={() => dismissAlert(alert.id, "arrived")}
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", background: "rgba(21,128,61,0.1)", border: "1px solid rgba(21,128,61,0.3)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#15803D", cursor: "pointer" }}>
                        <UserCheck size={13} /> Geldi
                      </button>
                      <button onClick={() => dismissAlert(alert.id, "noshow")}
                        style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 12px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#DC2626", cursor: "pointer" }}>
                        <UserX size={13} /> Gelmedi
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Pending banner */}
                {pending > 0 && isViewingToday && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)", borderRadius: "12px", padding: "14px 18px", marginBottom: "18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <AlertCircle size={15} style={{ color: "#B45309" }} />
                      <span style={{ fontSize: "13px", color: "#B45309", fontWeight: 600, letterSpacing: "-0.005em" }}>{pending} randevu onay bekliyor</span>
                    </div>
                    <span className="font-mono-custom hidden sm:inline" style={{ fontSize: "10px", color: "#92400E", letterSpacing: "0.12em", textTransform: "uppercase" }}>Aşağıdan güncelleyin</span>
                  </motion.div>
                )}

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", overflow: "hidden", boxShadow: SHADOW.card }}>
                  <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div className="font-display" style={{ fontSize: "16px", color: C.primary, fontWeight: 500, letterSpacing: "-0.01em" }}>
                      {isViewingToday ? "Bugünün Programı" : "Günün Programı"}
                    </div>
                    <span className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, background: C.surface, padding: "4px 10px", borderRadius: "999px", letterSpacing: "0.1em", textTransform: "uppercase" }}>{dayAppts.length} Randevu</span>
                  </div>
                  <div style={{ padding: "14px" }}>
                    {dayAppts.length === 0 ? (
                      <div style={{ padding: "56px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.18, color: C.primary }}>✂</div>
                        <div className="font-display" style={{ fontSize: "16px", color: C.primary, fontWeight: 500, marginBottom: "6px", letterSpacing: "-0.01em" }}>Bu gün için randevu yok</div>
                        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "18px" }}>İlk randevuyu eklemek için aşağıya tıkla</div>
                        <button onClick={() => setShowModal(true)} className="transition-colors"
                          style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: C.primary, border: "none", borderRadius: "9px", padding: "10px 18px", fontSize: "12.5px", fontWeight: 600, color: "var(--makas-bg)", cursor: "pointer", boxShadow: SHADOW.card }}>
                          <Plus size={13} strokeWidth={2.2} /> Randevu Ekle
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
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {isViewingToday && (
                  <div>
                    <div className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "12px" }}>
                      Sonraki Randevu
                    </div>
                    <NextAppointmentCard appt={displayNext} onAction={updateStatus} />
                  </div>
                )}

                {view === "dashboard" && (
                  <>
                    {/* Weekly / Monthly KPIs */}
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px", boxShadow: SHADOW.card }}>
                      <div className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px" }}>Kazançlarım</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                        <div>
                          <div className="font-display" style={{ fontSize: "20px", color: C.primary, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}>₺{weekRevenue.toLocaleString()}</div>
                          <div style={{ fontSize: "10px", color: C.muted, marginTop: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Bu Hafta</div>
                        </div>
                        <div>
                          <div className="font-display" style={{ fontSize: "20px", color: C.primary, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}>
                            ₺{(monthStats?.thisMonthBarberPaid ?? 0).toLocaleString()}
                          </div>
                          <div style={{ fontSize: "10px", color: C.muted, marginTop: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Bu Ay</div>
                        </div>
                        <div>
                          <div className="font-display" style={{ fontSize: "20px", color: C.primary, fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1 }}>{weekAppts}</div>
                          <div style={{ fontSize: "10px", color: C.muted, marginTop: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Hafta Tamam.</div>
                        </div>
                      </div>

                      {/* Mini bar chart */}
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "60px" }}>
                        {weekData.map((d, i) => {
                          const isToday_ = d.date === today;
                          const h = maxCount > 0 ? Math.max((d.count / maxCount) * 100, d.count > 0 ? 15 : 5) : 5;
                          const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "narrow" });
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%" }}>
                              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
                                <motion.div
                                  initial={{ height: 0 }} animate={{ height: `${h}%` }}
                                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                  style={{ width: "100%", background: isToday_ ? C.primary : d.count > 0 ? "rgba(17,17,17,0.32)" : C.dim, borderRadius: "4px 4px 0 0", minHeight: "3px" }}
                                />
                              </div>
                              <div className="font-mono-custom" style={{ fontSize: "9px", color: isToday_ ? C.primary : C.muted, fontWeight: isToday_ ? 700 : 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>{dayLabel}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Day summary */}
                    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px", boxShadow: SHADOW.card }}>
                      <div className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px" }}>Gün Özeti</div>
                      {[
                        { label: "Tamamlanan",       value: completed,                                                                                      color: C.secondary },
                        { label: "Bugün Kazanç",     value: `₺${revenue.toLocaleString()}`,                                                                 color: C.primary   },
                        { label: "Gelmedi",          value: noshow,                                                                                          color: noshow > 0 ? "#111111" : C.muted },
                        { label: "Tahmini Müsait",   value: freeSlots,                                                                                       color: C.muted     },
                        { label: "Değerlendirme",    value: barberData?.rating ? `${barberData.rating} ★` : "—", color: (barberData?.rating ?? 0) >= 4.5 ? "#15803D" : C.secondary },
                      ].map((s, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: i > 0 ? "12px" : 0, paddingBottom: i < 4 ? "12px" : 0, borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
                          <span style={{ fontSize: "12.5px", color: C.secondary }}>{s.label}</span>
                          <span className="font-mono-custom" style={{ fontSize: "13px", color: s.color, fontWeight: 600, letterSpacing: "-0.005em" }}>{s.value}</span>
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
      {showWalkIn && (
        <WalkInModal
          defaultBarberId={realBarberId ?? barberSlug}
          onClose={() => setShowWalkIn(false)}
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

  const syncPhotoToContext = (photo) =>
    updateUser(user?.barber ? { barber: { ...user.barber, profilePhoto: photo } } : {});

  const [username, setUsername]       = useState(user?.username ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg]   = useState(null); // { ok, text }

  const [profilePhoto, setProfilePhoto] = useState(user?.barber?.profilePhoto ?? null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [cropFile, setCropFile]         = useState(null);
  const photoRef = useRef(null);

  // Keep local state in sync when AuthContext receives a fresher profilePhoto
  // (e.g. /api/auth/me resolves after mount, or another writer updates it).
  useEffect(() => {
    setProfilePhoto(user?.barber?.profilePhoto ?? null);
  }, [user?.barber?.profilePhoto]);

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
      syncPhotoToContext(res.profilePhoto);
    } catch (err) { alert(err.message || "Fotoğraf yüklenemedi"); }
    finally { setPhotoLoading(false); }
  };

  const removePhoto = async () => {
    if (!confirm("Fotoğrafı kaldırmak istiyor musun?")) return;
    setPhotoLoading(true);
    try {
      await apiFetch("/api/barber/photo", { method: "DELETE" });
      setProfilePhoto(null);
      syncPhotoToContext(null);
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
                <div style={{ width: "100%", height: "100%", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, color: "var(--makas-bg)" }}>
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
          <div style={{ width: "40px", height: "40px", background: C.primary, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 700, color: "var(--makas-bg)", flexShrink: 0 }}>
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
            style={{ display: "flex", alignItems: "center", gap: "6px", background: C.primary, color: "var(--makas-bg)", border: "none", borderRadius: "9px", padding: "11px 20px", fontSize: "13px", fontWeight: 600, cursor: profileSaving ? "not-allowed" : "pointer", opacity: profileSaving ? 0.7 : 1 }}
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
            style={{ display: "flex", alignItems: "center", gap: "6px", background: C.primary, color: "var(--makas-bg)", border: "none", borderRadius: "9px", padding: "11px 20px", fontSize: "13px", fontWeight: 600, cursor: (pwdSaving || !curPwd || !newPwd || !confPwd) ? "not-allowed" : "pointer", opacity: (pwdSaving || !curPwd || !newPwd || !confPwd) ? 0.5 : 1 }}
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
  const [error, setError]     = useState(null);

  useEffect(() => {
    apiFetch("/api/barber/reviews")
      .then(d => setData(d))
      .catch(err => setError(err.message || "Yorumlar yüklenemedi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DSPageLoader />;

  if (error) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 24px" }}>
        <p style={{ fontSize: 13, color: "#991B1B" }}>{error}</p>
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
        <DSEmptyState
          icon={MessageSquare}
          title="Henüz yorum yok"
          sub="Tamamlanan randevulardan gelen değerlendirmeler burada görünür."
          compact
        />
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
                    <Star key={n} size={11} fill={n <= (r.barberRating ?? 0) ? C.primary : "none"} style={{ color: n <= (r.barberRating ?? 0) ? C.primary : C.dim }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.primary }}>{r.customerName}</span>
                <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto" }}>{formatRelBd(r.createdAt)}</span>
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
