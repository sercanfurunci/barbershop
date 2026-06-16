"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, Users, Settings,
  Bell, Search, Menu, ExternalLink, Plus, CalendarDays, LogOut, Scissors,
  UserCheck, TrendingUp, User, MoreHorizontal, X,
  ChevronLeft, ChevronRight, Activity, Clock,
} from "lucide-react";
import {
  BarberDayView, BarberAppointmentsList, BarberCustomersView,
  addDays, formatDateLong, isToday as isTodayDate, nowTimeStr,
} from "@/components/admin/BarberDashboardClient";
import KPICards from "./KPICards";
import AppointmentsList from "./AppointmentsList";
import BarbersManagement from "./BarbersManagement";
import AreaChart from "./AreaChart";
import CalendarView from "./CalendarView";
import ManualBookingModal from "./ManualBookingModal";
import SettingsPage from "./SettingsPage";
import ServicesManagement from "./ServicesManagement";
import NotificationsPage from "@/components/admin/NotificationsPage";
import Link from "next/link";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { barbers, workingHours } from "@/lib/data";
import { todayStr, toDateStr } from "@/lib/utils";
import { useAppointments } from "@/contexts/AppointmentsContext";

const C = {
  bg:       "#F8F6F2",
  sidebar:  "#FFFFFF",
  card:     "#FFFFFF",
  border:   "rgba(17,17,17,0.08)",
  surface:  "#F1EEE8",
  primary:  "#111111",
  secondary:"#57514B",
  muted:    "#6E6760",
  dim:      "#C9C2B7",
  red:      "#C62828",
};

const NAV_SECTIONS = (lang) => [
  {
    label: lang === "tr" ? "ANA MENÜ" : "MAIN",
    items: [
      { id: "overview",      label: "Genel Bakış",  icon: LayoutDashboard },
      { id: "calendar",      label: "Takvim",       icon: CalendarDays    },
      { id: "appointments",  label: "Randevular",   icon: Calendar        },
    ],
  },
  {
    label: lang === "tr" ? "YÖNETİM" : "MANAGE",
    items: [
      { id: "barbers",       label: "Berberler",    icon: Users           },
      { id: "customers",     label: "Müşteriler",   icon: UserCheck       },
      { id: "services-mgmt", label: "Hizmetler",    icon: Scissors        },
      { id: "barber-ops",    label: "Berber Görünümü", icon: Activity     },
    ],
  },
  {
    label: lang === "tr" ? "RAPOR" : "REPORTS",
    items: [
      { id: "revenue",        label: "Gelir",        icon: TrendingUp      },
      { id: "notifications", label: "Bildirimler",  icon: Bell            },
      { id: "settings",      label: "Ayarlar",      icon: Settings        },
    ],
  },
];

export default function AdminDashboard() {
  const [tab, setTab]               = useState("overview");
  const [drawer, setDrawer]         = useState(false);
  const [moreOpen, setMoreOpen]     = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [userMenu, setUserMenu]       = useState(false);
  const [globalBarberId, setGlobalBarberId] = useState(null);
  const { lang, setLang }           = useLang();
  const tx = useT(lang);
  const { logout, role, loaded } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleLogout = () => { logout(); router.push("/barber"); };
  const navSections = NAV_SECTIONS(lang);

  useEffect(() => {
    if (!loaded) return;
    if (!role) router.replace("/barber");
  }, [loaded, role, router]);

  if (!mounted || !loaded || !role) return null;

  return (
    <div className="flex min-h-screen" style={{ background: C.bg, fontFamily: "'Outfit', sans-serif" }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30 w-[220px]"
        style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
      >
        <Sidebar tab={tab} setTab={setTab} navSections={navSections} tx={tx} lang={lang} setLang={setLang} handleLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: "rgba(17,17,17,0.35)", backdropFilter: "blur(4px)" }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[220px] flex flex-col lg:hidden"
              style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
            >
              <Sidebar tab={tab} setTab={(t) => { setTab(t); setDrawer(false); }} navSections={navSections} tx={tx} lang={lang} setLang={setLang} handleLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 min-w-0 lg:ml-[220px] flex flex-col min-h-screen overflow-x-hidden">

        {/* Topbar */}
        <header
          className="h-14 flex items-center gap-4 px-5 lg:px-7 sticky top-0 z-20"
          style={{ background: `${C.bg}e8`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}
        >
          <button onClick={() => setDrawer(true)} className="hidden lg:flex w-11 h-11 items-center justify-center" style={{ color: C.secondary }}>
            <Menu size={18} />
          </button>

          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs px-3 h-8" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "6px" }}>
            <Search size={12} style={{ color: C.muted }} />
            <input
              placeholder={tx.admin.appointments.search}
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: C.primary, caretColor: C.red }}
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "tr" ? "en" : "tr")}
              className="flex items-center gap-1"
              style={{ fontSize: "10px", letterSpacing: "0.25em", color: C.secondary, height: "32px", padding: "0 8px", borderRadius: "4px" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.secondary)}
            >
              {lang === "tr" ? "EN" : "TR"}
            </button>

            <button className="relative w-8 h-8 flex items-center justify-center" style={{ color: C.secondary }}>
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: C.red }} />
            </button>

            {/* Berber Görünümü — top bar shortcut (md+, admin-only) */}
            <button
              onClick={() => { setTab("barber-ops"); setMoreOpen(false); }}
              className="hidden md:flex items-center gap-1.5"
              style={{
                height: "32px", padding: "0 10px",
                border: `1px solid ${tab === "barber-ops" ? `${C.red}50` : C.border}`,
                borderRadius: "6px", fontSize: "11px",
                color: tab === "barber-ops" ? C.red : C.secondary,
                background: tab === "barber-ops" ? `${C.red}10` : "transparent",
                cursor: "pointer", letterSpacing: "0.02em",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (tab !== "barber-ops") { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = "rgba(17,17,17,0.25)"; } }}
              onMouseLeave={(e) => { if (tab !== "barber-ops") { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.border; } }}
            >
              <Activity size={11} />
              Berber Görünümü
            </button>


            {/* User menu dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenu(!userMenu)}
                style={{ width: "36px", height: "36px", background: C.red, borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff" }}
              >
                MY
              </button>
              {userMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setUserMenu(false)} />
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "6px", zIndex: 200, minWidth: "160px", maxWidth: "calc(100vw - 32px)", boxShadow: "0 8px 24px rgba(17,17,17,0.12)" }}>
                    <div style={{ padding: "8px 10px 10px", borderBottom: `1px solid ${C.border}`, marginBottom: "4px" }}>
                      <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>Mehmet Yılmaz</div>
                      <div style={{ fontSize: "10px", color: C.secondary }}>Süper Admin</div>
                    </div>
                    {[
                      { label: "Profil", icon: User, action: () => { setUserMenu(false); } },
                      { label: "Ayarlar", icon: Settings, action: () => { setTab("settings"); setUserMenu(false); } },
                    ].map(({ label, icon: Icon, action }) => (
                      <button key={label} onClick={action} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "7px 10px", borderRadius: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: C.secondary, textAlign: "left" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; e.currentTarget.style.color = C.primary; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.secondary; }}
                      >
                        <Icon size={12} />
                        {label}
                      </button>
                    ))}
                    <div style={{ height: "1px", background: C.border, margin: "4px 0" }} />
                    <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "7px 10px", borderRadius: "6px", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#B91C1C", textAlign: "left" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(198,40,40,0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                    >
                      <LogOut size={12} />
                      Çıkış Yap
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Barber selector bar — mobile only, sticky below header */}
        <div className="sticky top-14 z-20 lg:hidden" style={{ background: `${C.bg}f0`, backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}>
          <BarberSelectorBar globalBarberId={globalBarberId} setGlobalBarberId={setGlobalBarberId} />
        </div>

        {/* Page body — calendar tab gets full height, others get scrollable padding */}
        {tab === "calendar" ? (
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: "env(safe-area-inset-bottom)" }}>
            <CalendarView />
          </main>
        ) : (
          <main className="flex-1 p-5 lg:p-8 pb-24 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {tab === "overview"      && <OverviewPage setTab={setTab} tx={tx} lang={lang} onNewBooking={() => setShowBooking(true)} barberId={globalBarberId} />}
                {tab === "appointments"  && <AppointmentsPage tx={tx} barberId={globalBarberId} />}
                {tab === "barbers"       && <BarbersPage tx={tx} />}
                {tab === "customers"     && <CustomersPage barberId={globalBarberId} />}
                {tab === "services-mgmt" && <ServicesManagement />}
                {tab === "revenue"        && <RevenuePage tx={tx} barberId={globalBarberId} />}
                {tab === "notifications" && <NotificationsPage />}
                {tab === "settings"      && <SettingsPage />}
                {tab === "barber-ops"    && <BarberOpsPage barberId={globalBarberId} />}
              </motion.div>
            </AnimatePresence>
          </main>
        )}
      </div>

      <MobileBottomNav tab={tab} setTab={setTab} moreOpen={moreOpen} setMoreOpen={setMoreOpen} onNewBooking={() => setShowBooking(true)} />

      {showBooking && (
        <ManualBookingModal onClose={() => setShowBooking(false)} />
      )}
    </div>
  );
}

/* ─── Barber Selector Bar (mobile top bar, second sticky row) ────────────── */

function BarberSelectorBar({ globalBarberId, setGlobalBarberId }) {
  const allOption = { id: null, label: "Tüm Berberler", avatar: null };
  const options = [allOption, ...barbers.map(b => ({ id: b.id, label: b.name.split(" ")[0], avatar: b.avatar }))];

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "8px 16px",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {options.map(({ id, label, avatar }) => {
        const active = globalBarberId === id;
        return (
          <button
            key={id ?? "all"}
            onClick={() => setGlobalBarberId(id)}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "5px 10px", borderRadius: "20px",
              background: active ? C.red : C.surface,
              border: `1px solid ${active ? C.red : C.border}`,
              color: active ? "#fff" : C.secondary,
              fontSize: "11px", fontWeight: active ? 600 : 400,
              whiteSpace: "nowrap", cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            {avatar && (
              <span style={{
                width: "16px", height: "16px", borderRadius: "4px",
                background: active ? "rgba(255,255,255,0.22)" : C.muted + "40",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "7px", fontWeight: 700,
                color: active ? "#fff" : C.muted,
                flexShrink: 0, letterSpacing: 0,
              }}>{avatar}</span>
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Mobile Bottom Navigation ───────────────────────────────────────────── */

const BOTTOM_NAV = [
  { id: "overview",     label: "Dashboard",   icon: LayoutDashboard },
  { id: "calendar",     label: "Takvim",      icon: CalendarDays    },
  { id: "appointments", label: "Randevular",  icon: Calendar        },
  { id: "customers",    label: "Müşteriler",  icon: UserCheck       },
];

const MORE_ITEMS = [
  { id: "barbers",       label: "Berberler",       icon: Users      },
  { id: "barber-ops",    label: "Berber Görünümü", icon: Activity   },
  { id: "services-mgmt", label: "Hizmetler",       icon: Scissors   },
  { id: "revenue",       label: "Gelir",           icon: TrendingUp },
  { id: "settings",      label: "Ayarlar",         icon: Settings   },
];

function MobileBottomNav({ tab, setTab, moreOpen, setMoreOpen, onNewBooking }) {
  const moreActive = MORE_ITEMS.some((i) => i.id === tab);

  const handleSelect = (id) => {
    setTab(id);
    setMoreOpen(false);
  };

  return (
    <>
      {/* More sheet backdrop */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            key="more-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 lg:hidden"
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
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 380, mass: 0.9 }}
            className="fixed left-0 right-0 z-50 lg:hidden"
            style={{
              bottom: "calc(64px + env(safe-area-inset-bottom))",
              background: C.card,
              borderTop: `1px solid ${C.border}`,
              borderRadius: "20px 20px 0 0",
              padding: "0 0 4px",
              boxShadow: "0 -8px 40px rgba(17,17,17,0.15)",
            }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: C.dim }} />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3">
              <span style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: C.muted, fontWeight: 500 }}>
                Diğer Menüler
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: C.surface, borderRadius: "6px", border: `1px solid ${C.border}`, color: C.secondary, cursor: "pointer" }}
              >
                <X size={12} />
              </button>
            </div>

            {/* Grid of items */}
            <div className="grid grid-cols-4 gap-2 px-4 pb-4">
              {MORE_ITEMS.map(({ id, label, icon: Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      gap: "8px", padding: "16px 8px",
                      background: active ? `${C.red}18` : C.surface,
                      border: `1px solid ${active ? `${C.red}40` : C.border}`,
                      borderRadius: "12px", cursor: "pointer",
                      minHeight: "80px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? `${C.red}22` : `${C.surface}`,
                        border: `1px solid ${active ? `${C.red}30` : C.border}`,
                      }}
                    >
                      <Icon size={16} style={{ color: active ? C.red : C.secondary }} />
                    </div>
                    <span style={{ fontSize: "10px", color: active ? C.primary : C.secondary, fontWeight: active ? 600 : 400, lineHeight: 1.2, textAlign: "center" }}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick action: New booking */}
            <div className="px-4 pb-4">
              <button
                onClick={() => { onNewBooking(); setMoreOpen(false); }}
                style={{
                  width: "100%", minHeight: "48px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  background: C.red, color: "#fff", border: "none", borderRadius: "12px",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.01em",
                }}
              >
                <Plus size={15} />
                Yeni Randevu Ekle
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <div
        className="fixed left-0 right-0 z-40 flex lg:hidden"
        style={{
          bottom: 0,
          height: "calc(64px + env(safe-area-inset-bottom))",
          background: `${C.sidebar}f5`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: `1px solid ${C.border}`,
          alignItems: "flex-start",
          paddingTop: "4px",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* 4 primary tabs */}
        {BOTTOM_NAV.map(({ id, label, icon: Icon }) => {
          const active = tab === id && !moreOpen;
          return (
            <button
              key={id}
              onClick={() => { setTab(id); setMoreOpen(false); }}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: "4px", minHeight: "56px", background: "none", border: "none", cursor: "pointer",
                padding: "4px 2px",
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {active && (
                  <motion.div
                    layoutId="bottom-nav-pill"
                    style={{
                      position: "absolute", inset: "-6px -10px",
                      background: `${C.red}18`,
                      borderRadius: "10px",
                    }}
                    transition={{ type: "spring", damping: 28, stiffness: 380 }}
                  />
                )}
                <Icon
                  size={20}
                  style={{ color: active ? C.red : C.muted, position: "relative", zIndex: 1, transition: "color 0.15s" }}
                />
              </div>
              <span style={{ fontSize: "9px", color: active ? C.primary : C.muted, fontWeight: active ? 600 : 400, letterSpacing: "0.02em", transition: "color 0.15s" }}>
                {label}
              </span>
            </button>
          );
        })}

        {/* More tab */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: "4px", minHeight: "56px", background: "none", border: "none", cursor: "pointer",
            padding: "4px 2px",
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {(moreActive || moreOpen) && (
              <motion.div
                layoutId="bottom-nav-pill"
                style={{
                  position: "absolute", inset: "-6px -10px",
                  background: `${C.red}18`,
                  borderRadius: "10px",
                }}
                transition={{ type: "spring", damping: 28, stiffness: 380 }}
              />
            )}
            <motion.div
              animate={{ rotate: moreOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ position: "relative", zIndex: 1, display: "flex" }}
            >
              {moreOpen
                ? <X size={20} style={{ color: moreActive || moreOpen ? C.red : C.muted }} />
                : <MoreHorizontal size={20} style={{ color: moreActive ? C.red : C.muted, transition: "color 0.15s" }} />
              }
            </motion.div>
            {moreActive && !moreOpen && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "6px", height: "6px", borderRadius: "50%", background: C.red, border: `2px solid ${C.sidebar}`, zIndex: 2 }} />
            )}
          </div>
          <span style={{ fontSize: "9px", color: moreActive || moreOpen ? C.primary : C.muted, fontWeight: moreActive || moreOpen ? 600 : 400, letterSpacing: "0.02em", transition: "color 0.15s" }}>
            Daha Fazla
          </span>
        </button>
      </div>
    </>
  );
}

/* ─── Barber Operational View ─────────────────────────────────────────────── */

const OPS_TABS = [
  { id: "schedule",     label: "Program",    icon: CalendarDays },
  { id: "appointments", label: "Randevular", icon: Calendar     },
  { id: "customers",    label: "Müşteriler", icon: UserCheck    },
  { id: "performance",  label: "Performans", icon: TrendingUp   },
];

function BarberOpsPage({ barberId }) {
  const [selectedId, setSelectedId]   = useState(barberId ?? null);
  const [opsView, setOpsView]         = useState("schedule");

  useEffect(() => {
    if (barberId !== undefined) setSelectedId(barberId);
  }, [barberId]);
  const [date, setDate]               = useState(todayStr());
  const [showBooking, setShowBooking] = useState(false);
  const { appointments, updateStatus } = useAppointments();
  const today = todayStr();

  const selectedBarber = selectedId ? barbers.find(b => b.id === selectedId) : null;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", color: C.primary, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: "4px" }}>
          Berber Görünümü
        </h2>
        <p style={{ fontSize: "12px", color: C.secondary }}>
          Herhangi bir berberin operasyonel görünümüne geçin. Program, randevular, müşteriler ve performans metrikleri.
        </p>
      </div>

      {/* Barber selector */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>
          Berber Seçin
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {barbers.map((b) => {
            const active       = selectedId === b.id;
            const todayCount   = appointments.filter(a => a.barberId === b.id && a.date === today && a.status !== "cancelled").length;
            const activeNow    = appointments.some(a => a.barberId === b.id && a.date === today && a.status === "in-progress");
            return (
              <button
                key={b.id}
                onClick={() => { setSelectedId(b.id); setOpsView("schedule"); }}
                style={{
                  background: active ? `${C.red}12` : C.card,
                  border: `1px solid ${active ? `${C.red}50` : C.border}`,
                  borderRadius: "12px", padding: "16px",
                  textAlign: "left", cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(17,17,17,0.18)"; e.currentTarget.style.background = C.surface; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; } }}
              >
                {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${C.red}, #9a1212, transparent)` }} />}
                <div style={{ width: "40px", height: "40px", background: active ? C.red : C.surface, border: `1px solid ${active ? "transparent" : C.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 700, color: active ? "#fff" : C.secondary, marginBottom: "12px" }}>
                  {b.avatar}
                </div>
                <div style={{ fontSize: "13px", color: active ? C.primary : C.secondary, fontWeight: active ? 600 : 400, lineHeight: 1.3, marginBottom: "2px" }}>{b.name}</div>
                <div style={{ fontSize: "10px", color: active ? C.red : C.muted, letterSpacing: "0.04em" }}>{b.title?.tr}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "8px" }}>
                  {activeNow && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#2563EB", display: "inline-block", animation: "pulse 1.5s infinite" }} />}
                  <span style={{ fontSize: "10px", color: C.muted }}>
                    {activeNow ? "Şu an koltukta" : `${todayCount} randevu bugün`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Operational panel */}
      {selectedBarber && (
        <>
          {/* Barber identity bar + add appointment */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", background: C.red, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                {selectedBarber.avatar}
              </div>
              <div>
                <div style={{ fontSize: "14px", color: C.primary, fontWeight: 600 }}>{selectedBarber.name}</div>
                <div style={{ fontSize: "10px", color: C.red, letterSpacing: "0.06em", textTransform: "uppercase" }}>{selectedBarber.title?.tr}</div>
              </div>
            </div>
            <button
              onClick={() => setShowBooking(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: C.red, color: "#fff", border: "none", borderRadius: "7px", padding: "0 14px", height: "36px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
            >
              <Plus size={13} /> Randevu Ekle
            </button>
          </div>

          {/* Ops sub-tabs */}
          <div className="flex gap-1 flex-wrap mb-5" style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: "0" }}>
            {OPS_TABS.map(({ id, label, icon: Icon }) => {
              const active = opsView === id;
              return (
                <button
                  key={id}
                  onClick={() => setOpsView(id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "8px 14px", fontSize: "12px", cursor: "pointer",
                    background: "none", border: "none",
                    color: active ? C.primary : C.secondary,
                    fontWeight: active ? 600 : 400,
                    borderBottom: `2px solid ${active ? C.red : "transparent"}`,
                    marginBottom: "-1px",
                    transition: "color 0.15s",
                  }}
                >
                  <Icon size={13} style={{ color: active ? C.red : C.secondary }} /> {label}
                </button>
              );
            })}
          </div>

          {/* Sub-view content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedId}-${opsView}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {opsView === "schedule" && (
                <BarberScheduleSection barberId={selectedId} date={date} setDate={setDate} appointments={appointments} updateStatus={updateStatus} />
              )}
              {opsView === "appointments" && (
                <BarberAppointmentsList barberId={selectedId} appointments={appointments} onAction={updateStatus} onNewBooking={() => setShowBooking(true)} />
              )}
              {opsView === "customers" && (
                <BarberCustomersView barberId={selectedId} appointments={appointments} onNewBooking={() => setShowBooking(true)} />
              )}
              {opsView === "performance" && (
                <BarberPerformanceView barberId={selectedId} appointments={appointments} />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {showBooking && (
        <ManualBookingModal defaultBarberId={selectedId} onClose={() => setShowBooking(false)} />
      )}
    </div>
  );
}

/* ─── Schedule Section (date nav + BarberDayView) ────────────────────────── */

function BarberScheduleSection({ barberId, date, setDate, appointments, updateStatus }) {
  const today          = todayStr();
  const isViewingToday = date === today;
  const wh            = workingHours[barberId] ?? { start: 9, end: 18 };

  return (
    <div>
      {/* Date nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "16px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {formatDateLong(date)}
            {isViewingToday && (
              <span style={{ marginLeft: "8px", fontSize: "10px", color: C.red, fontWeight: 700, letterSpacing: "0.08em", verticalAlign: "middle" }}>BUGÜN</span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>
            {wh.start}:00 – {wh.end}:00 çalışma saati
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button onClick={() => setDate(d => addDays(d, -1))} style={{ width: "36px", height: "36px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
            <ChevronLeft size={15} />
          </button>
          {!isViewingToday && (
            <button onClick={() => setDate(today)} style={{ height: "36px", padding: "0 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "7px", fontSize: "12px", color: C.secondary, cursor: "pointer" }}>
              Bugün
            </button>
          )}
          <button onClick={() => setDate(d => addDays(d, 1))} style={{ width: "36px", height: "36px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <BarberDayView barberId={barberId} date={date} appointments={appointments} updateStatus={updateStatus} />
    </div>
  );
}

/* ─── Performance View ───────────────────────────────────────────────────── */

function BarberPerformanceView({ barberId, appointments }) {
  const today      = todayStr();
  const thisMonth  = today.slice(0, 7);
  const barberAppts = appointments.filter(a => a.barberId === barberId);
  const monthAppts  = barberAppts.filter(a => a.date.startsWith(thisMonth));
  const completed   = monthAppts.filter(a => a.status === "completed");
  const noShows     = monthAppts.filter(a => a.status === "noshow");
  const cancelled   = monthAppts.filter(a => a.status === "cancelled");
  const monthRev    = completed.reduce((s, a) => s + (a.price || 0), 0);
  const valid       = monthAppts.filter(a => a.status !== "cancelled").length;
  const compRate    = valid > 0 ? Math.round((completed.length / valid) * 100) : 0;
  const avgRev      = completed.length > 0 ? Math.round(monthRev / completed.length) : 0;
  const monthLabel  = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d  = new Date(today + "T12:00:00");
    d.setDate(d.getDate() - (6 - i));
    const ds = toDateStr(d);
    const da = barberAppts.filter(a => a.date === ds);
    return {
      date: ds,
      label: d.toLocaleDateString("tr-TR", { weekday: "short" }),
      revenue: da.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0),
      count: da.filter(a => a.status !== "cancelled").length,
    };
  });
  const maxRev = Math.max(...last7.map(d => d.revenue), 1);

  // Service breakdown
  const svcMap     = completed.reduce((acc, a) => { acc[a.service] = (acc[a.service] || 0) + 1; return acc; }, {});
  const topSvc     = Object.entries(svcMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSvc     = topSvc[0]?.[1] || 1;

  // Customer retention
  const uniqueClients = [...new Set(completed.map(a => a.client))];
  const allDone       = barberAppts.filter(a => a.status === "completed");
  const returning     = uniqueClients.filter(n => allDone.filter(a => a.client === n).length > 1).length;
  const retention     = uniqueClients.length > 0 ? Math.round((returning / uniqueClients.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Toplam Randevu", value: monthAppts.length,           sub: monthLabel,                  color: C.primary  },
          { label: "Gelir",          value: `₺${monthRev.toLocaleString()}`, sub: `${completed.length} tamamlandı`, color: "#15803D"  },
          { label: "Tamamlanma",     value: `%${compRate}`,               sub: `${noShows.length} gelmedi`, color: compRate >= 80 ? "#15803D" : "#B45309" },
          { label: "Ort. Sepet",     value: `₺${avgRev.toLocaleString()}`, sub: "tamamlanan/randevu",        color: C.primary  },
        ].map((k, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px" }}>
            <div style={{ fontSize: "22px", color: k.color, fontWeight: 700, lineHeight: 1, marginBottom: "5px" }}>{k.value}</div>
            <div style={{ fontSize: "12px", color: C.secondary, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* 7-day revenue bar chart */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "18px" }}>
        <div style={{ fontSize: "11px", color: C.secondary, fontWeight: 500, marginBottom: "16px" }}>Son 7 Gün · Gelir</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "72px" }}>
          {last7.map((day, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", height: "100%" }}>
              <div
                title={`₺${day.revenue.toLocaleString()} · ${day.count} randevu`}
                style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}
              >
                <div style={{
                  width: "100%",
                  height: `${Math.max((day.revenue / maxRev) * 100, day.revenue > 0 ? 5 : 0)}%`,
                  background: day.date === today ? C.red : `${C.red}40`,
                  borderRadius: "3px 3px 0 0",
                }} />
              </div>
              <div style={{ fontSize: "9px", color: day.date === today ? C.primary : C.muted, fontWeight: day.date === today ? 600 : 400 }}>{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Service breakdown */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "18px" }}>
          <div style={{ fontSize: "11px", color: C.secondary, fontWeight: 500, marginBottom: "14px" }}>Hizmet Dağılımı · {monthLabel}</div>
          {topSvc.length === 0 ? (
            <div style={{ fontSize: "12px", color: C.muted }}>Bu ay tamamlanan randevu yok</div>
          ) : topSvc.map(([svc, cnt]) => (
            <div key={svc} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", color: C.secondary }}>{svc}</span>
                <span style={{ fontSize: "11px", color: C.primary, fontWeight: 600 }}>{cnt}</span>
              </div>
              <div style={{ height: "4px", background: C.border, borderRadius: "2px" }}>
                <div style={{ height: "100%", width: `${(cnt / maxSvc) * 100}%`, background: C.red, borderRadius: "2px" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Appointment status + customer retention */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "18px" }}>
          <div style={{ fontSize: "11px", color: C.secondary, fontWeight: 500, marginBottom: "14px" }}>Durum Dağılımı · {monthLabel}</div>
          {[
            { label: "Tamamlandı", count: completed.length,  color: "#15803D" },
            { label: "Gelmedi",    count: noShows.length,    color: C.red     },
            { label: "İptal",      count: cancelled.length,  color: "#52525b" },
          ].map(({ label, count, color }) => {
            const total = Math.max(monthAppts.length, 1);
            return (
              <div key={label} style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "11px", color: C.secondary }}>{label}</span>
                  <span style={{ fontSize: "11px", color, fontWeight: 600 }}>{count} · %{Math.round((count / total) * 100)}</span>
                </div>
                <div style={{ height: "4px", background: C.border, borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${(count / total) * 100}%`, background: color, borderRadius: "2px" }} />
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: C.secondary }}>Tekrar Eden Müşteri</span>
            <span style={{ fontSize: "14px", color: retention >= 50 ? "#15803D" : "#B45309", fontWeight: 700 }}>%{retention}</span>
          </div>
        </div>
      </div>

      {/* Available slots today */}
      <BarberAvailableSlots barberId={barberId} appointments={appointments} />
    </div>
  );
}

/* ─── Available Slots ────────────────────────────────────────────────────── */

function BarberAvailableSlots({ barberId, appointments }) {
  const today    = todayStr();
  const now      = nowTimeStr();
  const wh       = workingHours[barberId] ?? { start: 9, end: 18 };
  const slots    = [];
  for (let h = wh.start; h < wh.end; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  const booked   = appointments
    .filter(a => a.barberId === barberId && a.date === today && a.status !== "cancelled")
    .map(a => a.time);
  const futureAvail = slots.filter(s => !booked.includes(s) && s > now).length;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontSize: "11px", color: C.secondary, fontWeight: 500 }}>Bugün Müsait Slotlar</span>
        <span style={{ fontSize: "12px", color: "#15803D", fontWeight: 700 }}>{futureAvail} müsait</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
        {slots.map((slot) => {
          const isBooked = booked.includes(slot);
          const isPast   = slot < now;
          return (
            <div
              key={slot}
              style={{
                padding: "4px 9px", borderRadius: "5px", fontSize: "10px",
                fontFamily: "'DM Mono', monospace",
                background: isPast ? "transparent" : isBooked ? `${C.red}12` : "rgba(34,197,94,0.08)",
                border: `1px solid ${isPast ? "transparent" : isBooked ? `${C.red}28` : "rgba(34,197,94,0.2)"}`,
                color: isPast ? C.muted : isBooked ? "#B91C1C" : "#15803D",
                opacity: isPast ? 0.35 : 1,
              }}
            >
              {slot}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Sidebar({ tab, setTab, navSections, tx, lang, setLang, handleLogout }) {
  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: `1px solid ${C.border}` }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}
          onMouseEnter={(e) => { e.currentTarget.querySelector("span.name").style.color = C.red; }}
          onMouseLeave={(e) => { e.currentTarget.querySelector("span.name").style.color = C.primary; }}
        >
          <div className="w-6 h-6 flex items-center justify-center" style={{ background: C.red, borderRadius: "4px", transition: "transform 0.15s" }}>
            <span className="font-bold text-white" style={{ fontSize: "10px" }}>M</span>
          </div>
          <span className="name font-display" style={{ fontSize: "15px", letterSpacing: "0.25em", color: C.primary, textTransform: "uppercase", transition: "color 0.15s" }}>
            Makas
          </span>
        </Link>
        <span className="px-1.5 py-0.5 text-[9px] tracking-widest uppercase" style={{ background: `${C.red}18`, color: C.red, borderRadius: "3px" }}>
          Admin
        </span>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: "8px" }}>
            <p style={{ fontSize: "9px", letterSpacing: "0.35em", textTransform: "uppercase", color: C.muted, padding: "8px 10px 4px" }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className="w-full flex items-center gap-2.5 relative transition-all duration-150"
                    style={{
                      padding: "7px 10px",
                      borderRadius: "6px",
                      background: active ? C.surface : "transparent",
                      color: active ? C.primary : C.secondary,
                      fontSize: "13px",
                      textAlign: "left",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = `${C.surface}80`; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: C.red }} />
                    )}
                    <Icon size={14} style={{ color: active ? C.red : C.secondary, flexShrink: 0 }} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: user + logout + site link */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", background: C.red, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>MY</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12px", color: C.primary, fontWeight: 500, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Mehmet Yılmaz</div>
            <div style={{ fontSize: "10px", color: C.secondary }}>Süper Admin</div>
          </div>
          <button onClick={handleLogout} title="Çıkış" style={{ width: "28px", height: "28px", background: "none", border: `1px solid ${C.border}`, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary, flexShrink: 0 }}>
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Business KPIs ───────────────────────────────────────────────────────── */
function BusinessKPIs({ barberId }) {
  const { appointments } = useAppointments();
  const today = todayStr();

  const todayAppts  = appointments.filter(a => a.date === today && a.status !== "cancelled" && (!barberId || a.barberId === barberId));
  const completed   = todayAppts.filter(a => a.status === "completed");
  const noshows     = todayAppts.filter(a => a.status === "noshow");
  const pending     = todayAppts.filter(a => a.status === "pending");
  const todayRevenue = completed.reduce((s, a) => s + (a.price || 0), 0);
  const noShowRate   = todayAppts.length > 0 ? Math.round((noshows.length / todayAppts.length) * 100) : 0;
  const TOTAL_SLOTS  = 24;
  const totalCap     = barbers.length * TOTAL_SLOTS;
  const usedSlots    = todayAppts.reduce((s, a) => s + Math.ceil((a.duration || 30) / 30), 0);
  const chairOcc     = Math.round((usedSlots / totalCap) * 100);

  const cards = [
    { label: "Bugün Kasa",     value: `₺${todayRevenue.toLocaleString()}`, sub: `${completed.length} işlem tamamlandı`, hero: true },
    { label: "Toplam Randevu", value: todayAppts.length,                    sub: `${barbers.filter(b => b.available).length} berber aktif` },
    { label: "Koltuk Doluluk", value: `${chairOcc}%`,                       sub: `${usedSlots}/${totalCap} slot`, valueColor: chairOcc > 70 ? "#15803D" : chairOcc > 40 ? "#B45309" : C.primary },
    { label: "No-Show Oranı",  value: `${noShowRate}%`,                     sub: `${noshows.length} gelmedi`,     valueColor: noShowRate > 15 ? "#B91C1C" : C.primary },
    { label: "Onay Bekliyor",  value: pending.length,                       sub: pending.length > 0 ? "hemen işlem yap" : "tümü onaylandı", alert: pending.length > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <div key={i} className={i === 0 ? "col-span-2 lg:col-span-1" : ""} style={{
          background: c.hero ? `linear-gradient(135deg, ${C.red} 0%, #9a1212 100%)` : C.card,
          border: c.alert ? `1px solid rgba(245,158,11,0.4)` : `1px solid ${C.border}`,
          borderRadius: "10px", padding: "16px 18px", position: "relative", overflow: "hidden",
        }}>
          {c.hero && <div style={{ position: "absolute", right: "-16px", top: "-16px", width: "88px", height: "88px", background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />}
          <div style={{ fontSize: "9px", color: c.hero ? "rgba(255,255,255,0.55)" : C.secondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{c.label}</div>
          <div style={{ fontSize: c.hero ? "26px" : "22px", color: c.hero ? "#fff" : (c.valueColor || C.primary), fontWeight: c.hero ? 700 : 300, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "4px" }}>{c.value}</div>
          <div style={{ fontSize: "10px", color: c.hero ? "rgba(255,255,255,0.45)" : C.muted }}>{c.sub}</div>
          {c.alert && <div style={{ position: "absolute", top: "10px", right: "10px", width: "6px", height: "6px", borderRadius: "50%", background: "#B45309" }} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Staff Performance Cards ─────────────────────────────────────────────── */
function StaffPerformance({ barberId }) {
  const { appointments } = useAppointments();
  const today = todayStr();
  const todayAppts = appointments.filter(a => a.date === today && a.status !== "cancelled");
  const TOTAL_SLOTS = 24;
  const visibleBarbers = barberId ? barbers.filter(b => b.id === barberId) : barbers;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", fontWeight: 500, color: C.primary }}>Berber Performansı</span>
        <span style={{ fontSize: "10px", color: C.secondary, letterSpacing: "0.06em", textTransform: "uppercase" }}>Bugün</span>
      </div>
      <div style={{ padding: "12px", display: "grid", gridTemplateColumns: barberId ? "1fr" : "1fr 1fr", gap: "8px" }}>
        {visibleBarbers.map(b => {
          const bAppts   = todayAppts.filter(a => a.barberId === b.id);
          const bRevenue = bAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price || 0), 0);
          const bSlots   = bAppts.reduce((s, a) => s + Math.ceil((a.duration || 30) / 30), 0);
          const util     = Math.round((bSlots / TOTAL_SLOTS) * 100);
          const pendingCt = bAppts.filter(a => a.status === "pending").length;

          return (
            <div key={b.id} style={{ background: C.surface, borderRadius: "8px", padding: "12px 14px", border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ width: "30px", height: "30px", background: `linear-gradient(135deg, #C62828, #9a1212)`, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {b.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", color: C.primary, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name.split(" ")[0]}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: b.available ? "#15803D" : C.muted }} />
                    <span style={{ fontSize: "9px", color: b.available ? "#15803D" : C.muted }}>{b.available ? "Aktif" : "İzinli"}</span>
                  </div>
                </div>
                {pendingCt > 0 && (
                  <span style={{ fontSize: "9px", background: "rgba(245,158,11,0.15)", color: "#B45309", borderRadius: "4px", padding: "1px 5px", flexShrink: 0 }}>{pendingCt} bekl</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "8px", minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "16px", color: C.primary, fontWeight: 300, lineHeight: 1 }}>{bAppts.length}</div>
                  <div style={{ fontSize: "9px", color: C.muted }}>randevu</div>
                </div>
                <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                  <div style={{ fontSize: "16px", color: bRevenue > 0 ? C.primary : C.muted, fontWeight: 300, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>₺{bRevenue.toLocaleString()}</div>
                  <div style={{ fontSize: "9px", color: C.muted }}>gelir</div>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "9px", color: C.muted }}>Doluluk</span>
                  <span style={{ fontSize: "9px", color: util > 50 ? "#15803D" : C.secondary }}>{util}%</span>
                </div>
                <div style={{ height: "3px", background: C.border, borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${util}%`, background: util > 70 ? "#15803D" : util > 40 ? "#B45309" : C.red, borderRadius: "2px" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Pending Confirmations + Day Summary ─────────────────────────────────── */
function PendingConfirmations({ onNewBooking, barberId }) {
  const { appointments, updateStatus } = useAppointments();
  const today  = todayStr();
  const now    = new Date();
  const nowStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  const pending = appointments
    .filter(a => a.date === today && a.status === "pending" && (!barberId || a.barberId === barberId))
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = appointments
    .filter(a => a.date === today && !["cancelled","completed","noshow"].includes(a.status) && a.time >= nowStr && (!barberId || a.barberId === barberId))
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 5);

  const todayDone = appointments.filter(a => a.date === today && a.status === "completed" && (!barberId || a.barberId === barberId));
  const todayInProgress = appointments.filter(a => a.date === today && a.status === "in-progress" && (!barberId || a.barberId === barberId));
  const revenue = todayDone.reduce((s, a) => s + (a.price || 0), 0);
  const dateLabel = now.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

      {/* Onay Bekliyor card */}
      <div style={{ background: C.card, border: pending.length > 0 ? `1px solid rgba(245,158,11,0.25)` : `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: C.primary }}>Onay Bekliyor</span>
          {pending.length > 0
            ? <span style={{ fontSize: "10px", background: "rgba(245,158,11,0.15)", color: "#B45309", borderRadius: "4px", padding: "1px 6px" }}>{pending.length}</span>
            : <span style={{ fontSize: "10px", background: "rgba(34,197,94,0.1)", color: "#15803D", borderRadius: "4px", padding: "1px 6px" }}>✓</span>
          }
          <button onClick={onNewBooking} style={{ marginLeft: "auto", fontSize: "11px", color: C.red, background: "none", border: `1px solid rgba(198,40,40,0.25)`, borderRadius: "5px", padding: "3px 10px", cursor: "pointer" }}>+ Ekle</button>
        </div>
        {pending.length === 0 ? (
          <div style={{ padding: "14px 18px" }}>
            <p style={{ fontSize: "11px", color: C.muted }}>Tüm randevular onaylandı.</p>
          </div>
        ) : (
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {pending.map((appt, i) => {
              const brb = barbers.find(b => b.id === appt.barberId);
              return (
                <div key={appt.id} style={{ padding: "9px 14px", borderBottom: i < pending.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: C.secondary, minWidth: "36px", flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>{appt.time}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client}</div>
                    <div style={{ fontSize: "10px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.service} · {brb?.name.split(" ")[0]}</div>
                  </div>
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button onClick={() => updateStatus(appt.id, "confirmed")}
                      style={{ width: "26px", height: "26px", background: "rgba(34,197,94,0.12)", border: `1px solid rgba(34,197,94,0.25)`, borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#15803D", fontSize: "13px", lineHeight: 1 }}
                      title="Onayla"
                    >✓</button>
                    <button onClick={() => updateStatus(appt.id, "cancelled")}
                      style={{ width: "26px", height: "26px", background: "rgba(248,113,113,0.08)", border: `1px solid rgba(248,113,113,0.2)`, borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#B91C1C", fontSize: "13px", lineHeight: 1 }}
                      title="İptal"
                    >✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day summary card */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", fontWeight: 500, color: C.primary }}>Günlük Özet</span>
          <span style={{ fontSize: "10px", color: C.secondary }}>{dateLabel}</span>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", background: C.border }}>
          {[
            { label: "Kazanç",       value: `₺${revenue.toLocaleString()}`, color: revenue > 0 ? "#15803D" : C.secondary },
            { label: "Tamamlanan",   value: todayDone.length,               color: C.primary },
            { label: "Koltuğa Aldı", value: todayInProgress.length,         color: todayInProgress.length > 0 ? "#2563EB" : C.muted },
          ].map((s, i) => (
            <div key={i} style={{ background: C.card, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontSize: "18px", color: s.color, fontWeight: 300, lineHeight: 1, marginBottom: "3px" }}>{s.value}</div>
              <div style={{ fontSize: "9px", color: C.muted, letterSpacing: "0.04em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Upcoming appointments */}
        {upcoming.length > 0 ? (
          <>
            <div style={{ padding: "10px 14px 4px", fontSize: "9px", color: C.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Sıradaki Randevular · {upcoming.length}
            </div>
            {upcoming.map((appt, i) => {
              const brb      = barbers.find(b => b.id === appt.barberId);
              const isActive = appt.status === "in-progress";
              return (
                <div key={appt.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "11px", color: isActive ? "#2563EB" : C.primary, fontWeight: 600, minWidth: "38px", flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>{appt.time}</span>
                  <div style={{ width: "18px", height: "18px", background: `linear-gradient(135deg, ${C.red}, #9a1212)`, borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {brb?.avatar ?? "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client}</div>
                    <div style={{ fontSize: "10px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.service}</div>
                  </div>
                  {isActive && <span style={{ fontSize: "9px", color: "#2563EB", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", padding: "2px 6px", borderRadius: "4px", flexShrink: 0 }}>Devam</span>}
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ padding: "16px 18px" }}>
            <p style={{ fontSize: "11px", color: C.muted }}>Bugün kalan randevu yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Today Schedule ──────────────────────────────────────────────────────── */
function TodaySchedule({ onNewBooking, barberId }) {
  const { appointments } = useAppointments();
  const today = todayStr();
  const todayAppts = appointments
    .filter(a => a.date === today && a.status !== "cancelled" && (!barberId || a.barberId === barberId))
    .sort((a, b) => a.time.localeCompare(b.time));

  const SC = {
    pending:       { color: "#B45309" },
    confirmed:     { color: "#15803D" },
    "in-progress": { color: "#2563EB" },
    completed:     { color: "#57514B" },
    noshow:        { color: "#C62828" },
    cancelled:     { color: "#52525b" },
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", fontWeight: 500, color: C.primary }}>Günün Programı</span>
        <span style={{ fontSize: "11px", color: C.secondary }}>{todayAppts.length} randevu</span>
      </div>
      {todayAppts.length === 0 ? (
        <div style={{ padding: "32px 18px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: C.muted, marginBottom: "10px" }}>Bugün randevu yok</div>
          <button onClick={onNewBooking} style={{ fontSize: "11px", color: C.red, background: "none", border: `1px solid rgba(198,40,40,0.3)`, borderRadius: "6px", padding: "5px 12px", cursor: "pointer" }}>+ Randevu Ekle</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
          {todayAppts.map((appt, i) => {
            const sc  = SC[appt.status] ?? SC.pending;
            const brb = barbers.find(b => b.id === appt.barberId);
            return (
              <div key={appt.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 18px", borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "11px", color: C.primary, fontWeight: 600, minWidth: "38px", flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>{appt.time}</span>
                <div style={{ width: "20px", height: "20px", background: `linear-gradient(135deg, #C62828, #9a1212)`, borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "7px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {brb?.avatar ?? "??"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "11px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client}</div>
                  <div style={{ fontSize: "10px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.service}</div>
                </div>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Recent Activity Feed (xl third column) ─────────────────────────────── */
function RecentActivityFeed() {
  const { appointments } = useAppointments();
  const today = todayStr();

  const recent = [...appointments]
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .slice(0, 8);

  const STATUS_COLOR = {
    confirmed:     "#15803D",
    "in-progress": "#2563EB",
    pending:       "#B45309",
    completed:     "#57514B",
    cancelled:     "#52525b",
    noshow:        "#C62828",
  };
  const STATUS_LABEL = {
    confirmed: "Onaylandı", "in-progress": "Devam", pending: "Bekliyor",
    completed: "Tamamlandı", cancelled: "İptal", noshow: "Gelmedi",
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden", height: "100%" }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", fontWeight: 500, color: C.primary }}>Son Aktivite</span>
        <span style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Canlı</span>
      </div>
      <div style={{ overflowY: "auto", maxHeight: "360px" }}>
        {recent.map((appt, i) => {
          const brb = barbers.find(b => b.id === appt.barberId);
          const color = STATUS_COLOR[appt.status] ?? "#57514B";
          const isToday = appt.date === today;
          return (
            <div key={appt.id} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 18px", borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, marginTop: "5px", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "1px" }}>
                  <span style={{ fontSize: "12px", color: C.primary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.client}</span>
                  <span style={{ fontSize: "9px", color: color, background: `${color}18`, borderRadius: "3px", padding: "1px 5px", flexShrink: 0 }}>{STATUS_LABEL[appt.status]}</span>
                </div>
                <div style={{ fontSize: "10px", color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.service}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                  <div style={{ width: "14px", height: "14px", background: `linear-gradient(135deg, ${C.red}, #9a1212)`, borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "6px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {brb?.avatar}
                  </div>
                  <span style={{ fontSize: "10px", color: C.muted }}>{brb?.name.split(" ")[0]}</span>
                  <span style={{ fontSize: "10px", color: C.muted }}>·</span>
                  <span style={{ fontSize: "10px", color: isToday ? C.primary : C.muted, fontFamily: "'DM Mono', monospace" }}>{isToday ? appt.time : appt.date}</span>
                </div>
              </div>
              <span style={{ fontSize: "11px", color: C.primary, fontWeight: 600, flexShrink: 0 }}>₺{appt.price.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Overview Page ───────────────────────────────────────────────────────── */
function OverviewPage({ setTab, tx, lang, onNewBooking, barberId }) {
  const now     = new Date();
  const dateStr = now.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { weekday: "long", day: "numeric", month: "long" });
  const activeBarber = barberId ? barbers.find(b => b.id === barberId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeBarber ? activeBarber.name : tx.admin.greeting}
          </h1>
          <p style={{ fontSize: "12px", color: C.secondary, marginTop: "2px" }}>
            {activeBarber ? activeBarber.title?.tr : dateStr}
          </p>
        </div>
        <button
          onClick={onNewBooking}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 14px", background: C.red, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "#fff", flexShrink: 0 }}
        >
          <Plus size={14} />
          <span className="hidden sm:inline">Yeni Randevu</span>
        </button>
      </div>

      {/* Business KPIs */}
      <BusinessKPIs barberId={barberId} />

      {/* Staff performance + Pending confirmations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_340px] gap-4">
        <StaffPerformance barberId={barberId} />
        <PendingConfirmations onNewBooking={onNewBooking} barberId={barberId} />
        <div className="hidden xl:block">
          <RecentActivityFeed />
        </div>
      </div>

      {/* Today's full schedule */}
      <TodaySchedule onNewBooking={onNewBooking} barberId={barberId} />

      {/* Quick nav shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          { label: "Takvimi Aç",     tab: "calendar",     icon: CalendarDays },
          { label: "Tüm Randevular", tab: "appointments", icon: Calendar     },
          { label: "Gelir Raporu",   tab: "revenue",      icon: TrendingUp   },
        ].map(({ label, tab: t, icon: Icon }) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ padding: "11px 16px", borderRadius: "8px", background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", fontSize: "12px", color: C.secondary }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(198,40,40,0.2)"; e.currentTarget.style.color = C.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.secondary; }}
          >
            <Icon size={13} style={{ color: C.red }} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Appointments Page ───────────────────────────────────────────────────── */
function AppointmentsPage({ tx, barberId }) {
  const p = tx.admin.pages.appointments;
  const activeBarber = barberId ? barbers.find(b => b.id === barberId) : null;
  return (
    <div className="space-y-5">
      <PageHeader
        title={activeBarber ? `${activeBarber.name} · Randevular` : p.title}
        sub={activeBarber ? activeBarber.title?.tr : p.sub}
      />
      <AppointmentsList barberId={barberId} />
    </div>
  );
}

/* ─── Barbers Page ────────────────────────────────────────────────────────── */
function BarbersPage({ tx }) {
  const p = tx.admin.pages.barbers;
  return (
    <div className="space-y-5">
      <PageHeader title={p.title} sub={p.sub} />
      <BarbersManagement />
    </div>
  );
}

/* ─── Customers Page ──────────────────────────────────────────────────────── */
function CustomersPage({ barberId }) {
  const [search, setSearch]     = useState("");
  const [clients, setClients]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (barberId) params.set("barberId", barberId);
    apiFetch(`/api/admin/clients?${params}`)
      .then(data => { setClients(data.clients ?? []); setTotal(data.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, barberId]);

  return (
    <div>
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em" }}>
            Müşteriler
          </h1>
          <p style={{ fontSize: "12px", color: C.secondary, marginTop: "2px" }}>
            {loading ? "Yükleniyor…" : `${total} kayıt`}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 10px", height: "34px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "6px" }}>
          <Search size={11} style={{ color: C.muted }} />
          <input
            placeholder="İsim veya telefon ara…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", fontSize: "12px", color: C.primary, width: "180px" }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Yükleniyor…</div>
      ) : clients.length === 0 ? (
        <div style={{ padding: "48px", textAlign: "center", color: C.muted, fontSize: "13px" }}>
          {search ? "Arama sonucu bulunamadı." : "Henüz müşteri kaydı yok."}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Müşteri", "Telefon", "Ziyaret", "Toplam Harcama", "No-show", "Son Ziyaret"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: i < clients.length - 1 ? `1px solid ${C.border}` : "none" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface + "80"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>{c.name}</div>
                        {c.blocked && <span style={{ fontSize: "10px", color: "#B91C1C", background: "rgba(185,28,28,0.08)", borderRadius: "4px", padding: "1px 5px" }}>Engelli</span>}
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "12px", color: C.secondary, fontFamily: "monospace" }}>{c.phone}</span></td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "13px", color: C.primary }}>{c.visits}</span></td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>₺{(c.totalSpent ?? 0).toLocaleString()}</span></td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "12px", color: c.noShows > 0 ? "#B91C1C" : C.secondary }}>{c.noShows}</span></td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "12px", color: C.secondary }}>{c.lastVisit ?? "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="md:hidden" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
            {clients.map((c, i) => (
              <div key={c.id} style={{ padding: "14px 16px", borderBottom: i < clients.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ fontSize: "14px", color: C.primary, fontWeight: 500 }}>{c.name}</div>
                      {c.blocked && <span style={{ fontSize: "10px", color: "#B91C1C" }}>Engelli</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: C.secondary, fontFamily: "monospace", marginTop: "1px" }}>{c.phone}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", color: C.primary, fontWeight: 600 }}>₺{(c.totalSpent ?? 0).toLocaleString()}</div>
                    <div style={{ fontSize: "10px", color: C.secondary, marginTop: "1px" }}>{c.visits} ziyaret</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", color: C.muted }}>{c.lastVisit ?? "—"}</span>
                  {c.noShows > 0 && <span style={{ fontSize: "11px", color: "#B91C1C" }}>{c.noShows} no-show</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Revenue Page ────────────────────────────────────────────────────────── */
function RevenuePage({ tx, barberId }) {
  const { appointments } = useAppointments();
  const activeBarber = barberId ? barbers.find(b => b.id === barberId) : null;
  const today = todayStr();
  const thisMonth = today.slice(0, 7);

  const filtered = barberId ? appointments.filter(a => a.barberId === barberId) : null;
  const monthCompleted = filtered ? filtered.filter(a => a.date.startsWith(thisMonth) && a.status === "completed") : null;
  const monthRev = monthCompleted ? monthCompleted.reduce((s, a) => s + (a.price || 0), 0) : null;
  const todayRev = filtered ? filtered.filter(a => a.date === today && a.status === "completed").reduce((s, a) => s + (a.price || 0), 0) : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em" }}>
          {activeBarber ? `${activeBarber.name} · Gelir` : "Gelir"}
        </h1>
        <p style={{ fontSize: "12px", color: C.secondary, marginTop: "2px" }}>
          {activeBarber ? activeBarber.title?.tr : "Son 30 günlük gelir analizi"}
        </p>
      </div>

      {activeBarber && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Bu Ay Gelir",    value: `₺${monthRev?.toLocaleString() ?? 0}`, sub: `${monthCompleted?.length ?? 0} işlem` },
            { label: "Bugün Gelir",    value: `₺${todayRev?.toLocaleString() ?? 0}`, sub: "tamamlanan" },
            { label: "Tamamlanma",     value: `${monthCompleted && filtered ? Math.round((monthCompleted.length / Math.max(filtered.filter(a => a.date.startsWith(thisMonth) && a.status !== "cancelled").length, 1)) * 100) : 0}%`, sub: "bu ay" },
            { label: "Ort. Sepet",     value: `₺${monthCompleted?.length ? Math.round(monthRev / monthCompleted.length).toLocaleString() : 0}`, sub: "tamamlanan başına" },
          ].map((k, i) => (
            <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontSize: "9px", color: C.secondary, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{k.label}</div>
              <div style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "4px" }}>{k.value}</div>
              <div style={{ fontSize: "10px", color: C.muted }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {!activeBarber && (
        <>
          <KPICards />
          <AreaChart />
        </>
      )}
    </div>
  );
}

/* ─── Settings Page ───────────────────────────────────────────────────────── */
/* ─── Page Header ─────────────────────────────────────────────────────────── */
function PageHeader({ title, sub }) {
  return (
    <div>
      <h1 className="font-display font-light" style={{ fontSize: "26px", color: C.primary, letterSpacing: "-0.01em" }}>{title}</h1>
      <p style={{ fontSize: "13px", color: C.secondary, marginTop: "3px" }}>{sub}</p>
    </div>
  );
}
