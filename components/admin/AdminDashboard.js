"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Logo from "@/components/common/Logo";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  LayoutDashboard, Calendar, Users, Settings,
  Bell, Search, ExternalLink, Plus, CalendarDays, LogOut, Scissors,
  UserCheck, TrendingUp, User, MoreHorizontal, X, Check,
  ChevronLeft, ChevronRight, Activity, Clock, Star, CreditCard,
  UserX, Bot, Sun, Moon,
} from "lucide-react";
import { DSPageLoader, DSEmptyState, DSSkeleton } from "@/components/ds";
import {
  BarberDayView, BarberAppointmentsList, BarberCustomersView,
  addDays, formatDateLong, isToday as isTodayDate, nowTimeStr,
} from "@/components/admin/BarberDashboardClient";
import AppointmentsList from "./AppointmentsList";
import SubscriptionBanner from "@/components/admin/SubscriptionBanner";
import LandingAnalyticsPanel from "@/components/admin/LandingAnalyticsPanel";
import DashboardTopbar from "@/components/admin/DashboardTopbar";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter, useParams } from "next/navigation";
import { todayStr, toDateStr } from "@/lib/utils";
import { useAppointments } from "@/contexts/AppointmentsContext";
import { apiFetch, setPreviewShopId } from "@/lib/api";
import { useShop } from "@/contexts/ShopContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { C, CA, SHADOW } from "@/lib/adminTheme";
import { AdminTabContext } from "@/contexts/AdminTabContext";

// Heavy tab components — loaded only when the tab is first visited
const TabSpinner = () => (
  <div className="space-y-4 p-1 pt-2">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1,2,3,4].map(i => <DSSkeleton key={i} className="h-24 rounded-[14px]" />)}
    </div>
    <DSSkeleton className="h-64 rounded-[14px]" />
    <div className="space-y-2">
      {[1,2,3].map(i => <DSSkeleton key={i} className="h-16 rounded-[12px]" />)}
    </div>
  </div>
);
const KPICards           = dynamic(() => import("./KPICards"),                             { loading: TabSpinner });
const BarbersManagement  = dynamic(() => import("./BarbersManagement"),                    { loading: TabSpinner });
const AreaChart          = dynamic(() => import("./AreaChart"),                            { loading: TabSpinner });
const CalendarView       = dynamic(() => import("./CalendarView"),                         { loading: TabSpinner });
const ManualBookingModal = dynamic(() => import("./ManualBookingModal"),                   { loading: () => null });
const WalkInModal        = dynamic(() => import("./WalkInModal"),                          { loading: () => null });
const SettingsPage       = dynamic(() => import("./SettingsPage"),                         { loading: TabSpinner });
const ServicesManagement = dynamic(() => import("./ServicesManagement"),                   { loading: TabSpinner });
const NotificationsPage  = dynamic(() => import("@/components/admin/NotificationsPage"),   { loading: TabSpinner });
const ReviewsPage        = dynamic(() => import("@/components/admin/ReviewsPage"),         { loading: TabSpinner });
const BillingPage        = dynamic(() => import("@/components/admin/BillingPage"),         { loading: TabSpinner });
const AIPlatformPage     = dynamic(() => import("@/components/admin/AIPlatformPage"),      { loading: TabSpinner });

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
      { id: "reviews",        label: "Yorumlar",     icon: Star            },
      { id: "notifications", label: "Bildirimler",  icon: Bell            },
      { id: "billing",       label: "Abonelik",     icon: CreditCard      },
      { id: "settings",      label: "Ayarlar",      icon: Settings        },
    ],
  },
  {
    label: lang === "tr" ? "AI PLATFORM" : "AI PLATFORM",
    items: [
      { id: "ai-platform", label: "AI Platform", icon: Bot },
    ],
  },
];

export default function AdminDashboard() {
  const [tab, setTab]               = useState("overview");
  const [settingsTab, setSettingsTab] = useState(null); // sub-tab hint for SettingsPage
  const [moreOpen, setMoreOpen]     = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showWalkIn, setShowWalkIn]   = useState(false);
  const [globalBarberId, setGlobalBarberId] = useState(null);
  const { lang, setLang }           = useLang();
  const tx = useT(lang);
  const { logout, role, loaded, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const shop = useShop();
  const shopSlug = user?.shop?.slug ?? params?.shopSlug;
  const isSuperPreview = role === "superadmin" && !!shop?.id;
  const [mounted, setMounted] = useState(false);
  const [realBarbers, setRealBarbers] = useState([]);

  useBodyScrollLock(moreOpen);

  // Superadmin preview: stamp tenant shopId so apiFetch auto-scopes admin calls.
  // ponytail: module-level state in lib/api.js — single dashboard mounts at a time.
  useEffect(() => {
    if (!isSuperPreview) return;
    setPreviewShopId(shop.id);
    return () => setPreviewShopId(null);
  }, [isSuperPreview, shop?.id]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!loaded || !role) return;
    // Wait until preview shopId is set before fetching, so the request is scoped.
    if (isSuperPreview && !shop?.id) return;
    apiFetch("/api/admin/barbers")
      .then(list => setRealBarbers(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, [loaded, role, isSuperPreview, shop?.id]);

  const handleLogout = () => { const s = user?.shop?.slug ?? shopSlug; logout(); router.push(s ? `/${s}/barber` : "/"); };
  const navSections = NAV_SECTIONS(lang);

  useEffect(() => {
    if (!loaded) return;
    if (!role) {
      router.replace(shopSlug ? `/${shopSlug}/barber` : "/");
      return;
    }
    if (role !== "admin" && role !== "superadmin") {
      const dest = user?.shop?.slug ?? shopSlug;
      router.replace(dest ? `/${dest}/barber/${role}` : "/");
      return;
    }
    // Correct the URL if the slug in the path doesn't match the logged-in shop
    if (role === "admin" && user?.shop?.slug && params?.shopSlug && user.shop.slug !== params.shopSlug) {
      router.replace(`/${user.shop.slug}/admin`);
    }
  }, [loaded, role, router, shopSlug, user?.shop?.slug, params?.shopSlug]);

  if (!mounted || !loaded || !role) return null;
  if (role !== "admin" && role !== "superadmin") return null;

  return (
    <AdminTabContext.Provider value={{ setTab, settingsTab, setSettingsTab }}>
    <div className="flex min-h-screen" style={{ background: C.bg, fontFamily: "'Outfit', sans-serif" }}>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30 w-[220px]"
        style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
      >
        <Sidebar tab={tab} setTab={setTab} navSections={navSections} tx={tx} lang={lang} setLang={setLang} handleLogout={handleLogout} user={user} />
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 lg:ml-[220px] flex flex-col min-h-screen overflow-x-hidden">

        {isSuperPreview && (
          <div
            className="px-5 lg:px-7 py-2 flex items-center justify-between gap-3 text-xs"
            style={{ background: "#1F2937", color: "#F9FAFB", letterSpacing: "0.02em" }}
          >
            <span>
              <strong style={{ fontWeight: 600 }}>Superadmin Preview Mode</strong>
              {shop?.name ? ` — ${shop.name}` : ""}
            </span>
            <Link href="/superadmin" style={{ color: "#F9FAFB", opacity: 0.8, textDecoration: "underline" }}>
              Konsola dön
            </Link>
          </div>
        )}

        <DashboardTopbar
          brand={{
            href: user?.shop?.slug ? `/${user.shop.slug}` : "/",
            label: user?.shop?.name ?? "Makas",
            initial: (user?.shop?.name ?? "M")[0].toUpperCase(),
          }}
          lang={lang}
          onLangToggle={() => setLang(lang === "tr" ? "en" : "tr")}
          notifications={{ badge: "dot" }}
          extras={
            <button
              onClick={() => { setTab("barber-ops"); setMoreOpen(false); }}
              className="hidden md:flex items-center gap-1.5"
              style={{
                height: "32px", padding: "0 10px",
                border: `1px solid ${tab === "barber-ops" ? CA.ink50 : C.border}`,
                borderRadius: "6px", fontSize: "11px",
                color: tab === "barber-ops" ? C.primary : C.secondary,
                background: tab === "barber-ops" ? CA.ink10 : "transparent",
                cursor: "pointer", letterSpacing: "0.02em",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (tab !== "barber-ops") { e.currentTarget.style.color = C.primary; e.currentTarget.style.borderColor = "rgba(17,17,17,0.25)"; } }}
              onMouseLeave={(e) => { if (tab !== "barber-ops") { e.currentTarget.style.color = C.secondary; e.currentTarget.style.borderColor = C.border; } }}
            >
              <Activity size={11} />
              Berber Görünümü
            </button>
          }
          userMenu={{
            initials: (user?.displayName ?? user?.username ?? user?.email ?? "A").split(/[\s@]/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "A",
            headerName: user?.displayName ?? user?.username ?? "Admin",
            headerRole: user?.role === "SUPER_ADMIN" ? "Süper Admin" : user?.role === "ADMIN" ? "Admin" : user?.role === "BARBER" ? "Berber" : "Yönetici",
            items: [
              { icon: User,     label: "Profil",   action: () => {} },
              { icon: Settings, label: "Ayarlar",  action: () => setTab("settings") },
              { divider: true },
              { icon: LogOut,   label: "Çıkış Yap", action: handleLogout, danger: true },
            ],
          }}
        />

        {/* Barber selector bar — mobile only, sticky below header */}
        <div className="sticky top-16 z-20 lg:hidden" style={{ background: CA.bgf0, backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}` }}>
          <BarberSelectorBar globalBarberId={globalBarberId} setGlobalBarberId={setGlobalBarberId} realBarbers={realBarbers} />
        </div>

        <SubscriptionBanner shop={user?.shop} onUpgrade={() => setTab("billing")} />

        {/* Page body — calendar tab gets full height, others get scrollable padding */}
        {tab === "calendar" ? (
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: "env(safe-area-inset-bottom)" }}>
            <CalendarView />
          </main>
        ) : (
          <main className="flex-1 w-full p-5 lg:p-8 pb-24 lg:pb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full"
              >
                {tab === "overview"      && <OverviewPage setTab={setTab} tx={tx} lang={lang} onNewBooking={() => setShowBooking(true)} onWalkIn={() => setShowWalkIn(true)} barberId={globalBarberId} realBarbers={realBarbers} />}
                {tab === "appointments"  && <AppointmentsPage tx={tx} barberId={globalBarberId} realBarbers={realBarbers} />}
                {tab === "barbers"       && <BarbersPage tx={tx} />}
                {tab === "customers"     && <CustomersPage barberId={globalBarberId} />}
                {tab === "services-mgmt" && <ServicesManagement />}
                {tab === "revenue"        && <RevenuePage tx={tx} barberId={globalBarberId} realBarbers={realBarbers} />}
                {tab === "reviews"        && <ReviewsPage />}
                {tab === "notifications" && <NotificationsPage />}
                {tab === "billing"        && <BillingPage />}
                {tab === "settings"      && <SettingsPage defaultTab={settingsTab} />}
                {tab === "barber-ops"    && <BarberOpsPage barberId={globalBarberId} />}
                {tab === "ai-platform"   && <AIPlatformPage />}
              </motion.div>
            </AnimatePresence>
          </main>
        )}
      </div>

      <MobileBottomNav tab={tab} setTab={setTab} moreOpen={moreOpen} setMoreOpen={setMoreOpen} onNewBooking={() => setShowBooking(true)} />

      {showBooking && (
        <ManualBookingModal onClose={() => setShowBooking(false)} />
      )}
      {showWalkIn && (
        <WalkInModal onClose={() => setShowWalkIn(false)} />
      )}
    </div>
    </AdminTabContext.Provider>
  );
}

/* ─── Barber Selector Bar (mobile top bar, second sticky row) ────────────── */

function BarberSelectorBar({ globalBarberId, setGlobalBarberId, realBarbers = [] }) {
  const allOption = { id: null, label: "Tüm Berberler", avatar: null };
  const options = [allOption, ...realBarbers.map(b => ({ id: b.id, label: (b.nameTr ?? b.name ?? "").split(" ")[0], avatar: b.avatar }))];

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto no-scrollbar w-full">
      {options.map(({ id, label, avatar }) => {
        const active = globalBarberId === id;
        return (
          <button
            key={id ?? "all"}
            onClick={() => setGlobalBarberId(id)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-medium whitespace-nowrap shrink-0 transition-all duration-150 border"
            style={{
              background: active ? "var(--makas-ink)" : "var(--makas-surface2)",
              borderColor: active ? "var(--makas-ink)" : "var(--makas-border)",
              color: active ? "var(--makas-bg)" : "var(--makas-ink-secondary)",
              fontWeight: active ? 600 : 400,
            }}
          >
            {avatar && (
              <span
                className="flex items-center justify-center shrink-0 rounded-[3px] text-[7px] font-bold"
                style={{
                  width: "14px", height: "14px",
                  background: active ? "var(--makas-bg-f0)" : "rgba(17,17,17,0.1)",
                  color: active ? "var(--makas-ink)" : "var(--makas-ink-muted)",
                }}
              >{avatar}</span>
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
  { id: "reviews",       label: "Yorumlar",        icon: Star       },
  { id: "notifications", label: "Bildirimler",     icon: Bell       },
  { id: "billing",       label: "Abonelik",        icon: CreditCard },
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
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-0 right-0 z-50 lg:hidden"
            style={{
              bottom: "calc(64px + env(safe-area-inset-bottom))",
              background: C.card,
              borderTop: `1px solid ${C.border}`,
              borderRadius: "20px 20px 0 0",
              padding: "0 0 4px",
              boxShadow: "0 -8px 40px rgba(17,17,17,0.15)",
              maxHeight: "calc(100dvh - 64px - env(safe-area-inset-bottom) - 24px)",
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
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
                      background: active ? CA.ink18 : C.surface,
                      border: `1px solid ${active ? CA.ink40 : C.border}`,
                      borderRadius: "12px", cursor: "pointer",
                      minHeight: "80px",
                    }}
                  >
                    <div
                      style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: active ? CA.ink22 : `${C.surface}`,
                        border: `1px solid ${active ? CA.ink30 : C.border}`,
                      }}
                    >
                      <Icon size={16} style={{ color: active ? C.primary : C.secondary }} />
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
                  background: C.primary, color: "var(--makas-bg)", border: "none", borderRadius: "12px",
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
          background: CA.bgf0,
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
                      background: CA.ink18,
                      borderRadius: "10px",
                    }}
                    transition={{ type: "spring", damping: 28, stiffness: 380 }}
                  />
                )}
                <Icon
                  size={20}
                  style={{ color: active ? C.primary : C.muted, position: "relative", zIndex: 1, transition: "color 0.15s" }}
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
                  background: CA.ink18,
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
                ? <X size={20} style={{ color: moreActive || moreOpen ? C.primary : C.muted }} />
                : <MoreHorizontal size={20} style={{ color: moreActive ? C.primary : C.muted, transition: "color 0.15s" }} />
              }
            </motion.div>
            {moreActive && !moreOpen && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "6px", height: "6px", borderRadius: "50%", background: C.primary, border: `2px solid ${C.sidebar}`, zIndex: 2 }} />
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
  const [realBarbers, setRealBarbers] = useState([]);

  useEffect(() => {
    apiFetch("/api/admin/barbers")
      .then(list => setRealBarbers(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (barberId !== undefined) setSelectedId(barberId);
  }, [barberId]);
  const [date, setDate]               = useState(todayStr());
  const [showBooking, setShowBooking] = useState(false);
  const [showWalkIn, setShowWalkIn]   = useState(false);
  const { appointments, updateStatus } = useAppointments();
  const today = todayStr();

  const selectedBarber = selectedId ? realBarbers.find(b => b.id === selectedId) : null;

  // Derive today's working hours from the barber's schedule
  const selectedBarberWH = (() => {
    if (!selectedBarber?.workingHours?.length) return { start: 9, end: 18 };
    const dow = (new Date().getDay() + 6) % 7;
    const wh = selectedBarber.workingHours.find(h => h.dayOfWeek === dow);
    if (!wh || !wh.isOpen) return { start: 9, end: 18 };
    return { start: parseInt(wh.startTime), end: parseInt(wh.endTime) };
  })();

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
          {realBarbers.map((b) => {
            const active       = selectedId === b.id;
            const todayCount   = appointments.filter(a => a.barberId === b.id && a.date === today && a.status !== "cancelled").length;
            const activeNow    = appointments.some(a => a.barberId === b.id && a.date === today && a.status === "in-progress");
            return (
              <button
                key={b.id}
                onClick={() => { setSelectedId(b.id); setOpsView("schedule"); }}
                style={{
                  background: active ? CA.ink12 : C.card,
                  border: `1px solid ${active ? CA.ink50 : C.border}`,
                  borderRadius: "12px", padding: "16px",
                  textAlign: "left", cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = "rgba(17,17,17,0.18)"; e.currentTarget.style.background = C.surface; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; } }}
              >
                {active && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${C.primary}, #111111, transparent)` }} />}
                <div style={{ width: "40px", height: "40px", background: active ? C.primary : C.surface, border: `1px solid ${active ? "transparent" : C.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 700, color: active ? "var(--makas-bg)" : C.secondary, marginBottom: "12px" }}>
                  {b.avatar}
                </div>
                <div style={{ fontSize: "13px", color: active ? C.primary : C.secondary, fontWeight: active ? 600 : 400, lineHeight: 1.3, marginBottom: "2px" }}>{b.nameTr}</div>
                <div style={{ fontSize: "10px", color: active ? C.primary : C.muted, letterSpacing: "0.04em" }}>{b.titleTr}</div>
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
              <div style={{ width: "36px", height: "36px", background: C.primary, borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--makas-bg)", flexShrink: 0 }}>
                {selectedBarber.avatar}
              </div>
              <div>
                <div style={{ fontSize: "14px", color: C.primary, fontWeight: 600 }}>{selectedBarber.nameTr}</div>
                <div style={{ fontSize: "10px", color: C.primary, letterSpacing: "0.06em", textTransform: "uppercase" }}>{selectedBarber.titleTr}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setShowWalkIn(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, color: C.primary, border: `1px solid ${C.border}`, borderRadius: 7, padding: "0 12px", minHeight: 44, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                title="Şimdi gelen müşteriyi kaydet"
              >
                <Plus size={13} /> Walk-in
              </button>
              <button
                onClick={() => setShowBooking(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: C.primary, color: "var(--makas-bg)", border: "none", borderRadius: "10px", padding: "0 14px", minHeight: "44px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                <Plus size={13} /> Randevu Ekle
              </button>
            </div>
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
                    borderBottom: `2px solid ${active ? C.primary : "transparent"}`,
                    marginBottom: "-1px",
                    transition: "color 0.15s",
                  }}
                >
                  <Icon size={13} style={{ color: active ? C.primary : C.secondary }} /> {label}
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
                <BarberScheduleSection barberId={selectedId} date={date} setDate={setDate} appointments={appointments} updateStatus={updateStatus} barberWH={selectedBarberWH} />
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
      {showWalkIn && (
        <WalkInModal defaultBarberId={selectedId} onClose={() => setShowWalkIn(false)} />
      )}
    </div>
  );
}

/* ─── Schedule Section (date nav + BarberDayView) ────────────────────────── */

function BarberScheduleSection({ barberId, date, setDate, appointments, updateStatus, barberWH }) {
  const today          = todayStr();
  const isViewingToday = date === today;
  const wh            = barberWH ?? { start: 9, end: 18 };

  return (
    <div>
      {/* Date nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "16px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {formatDateLong(date)}
            {isViewingToday && (
              <span style={{ marginLeft: "8px", fontSize: "10px", color: C.primary, fontWeight: 700, letterSpacing: "0.08em", verticalAlign: "middle" }}>BUGÜN</span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>
            {wh.start}:00 – {wh.end}:00 çalışma saati
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button onClick={() => setDate(d => addDays(d, -1))} style={{ width: "44px", height: "44px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
            <ChevronLeft size={15} />
          </button>
          {!isViewingToday && (
            <button onClick={() => setDate(today)} style={{ height: "44px", padding: "0 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", fontSize: "12px", color: C.secondary, cursor: "pointer" }}>
              Bugün
            </button>
          )}
          <button onClick={() => setDate(d => addDays(d, 1))} style={{ width: "44px", height: "44px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
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

  const stats = useMemo(() => {
    const barberAppts = appointments.filter(a => a.barberId === barberId);
    const monthAppts  = barberAppts.filter(a => a.date.startsWith(thisMonth));
    const completed   = monthAppts.filter(a => a.status === "completed");
    const noShows     = monthAppts.filter(a => a.status === "noshow");
    const cancelled   = monthAppts.filter(a => a.status === "cancelled");
    const monthRev    = completed.reduce((s, a) => s + (a.price || 0), 0);
    const valid       = monthAppts.filter(a => a.status !== "cancelled").length;
    const compRate    = valid > 0 ? Math.round((completed.length / valid) * 100) : 0;
    const avgRev      = completed.length > 0 ? Math.round(monthRev / completed.length) : 0;

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

    const svcMap     = completed.reduce((acc, a) => { acc[a.service] = (acc[a.service] || 0) + 1; return acc; }, {});
    const topSvc     = Object.entries(svcMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxSvc     = topSvc[0]?.[1] || 1;

    const uniqueClients = [...new Set(completed.map(a => a.client))];
    const allDone       = barberAppts.filter(a => a.status === "completed");
    const returning     = uniqueClients.filter(n => allDone.filter(a => a.client === n).length > 1).length;
    const retention     = uniqueClients.length > 0 ? Math.round((returning / uniqueClients.length) * 100) : 0;

    return { monthAppts, completed, noShows, cancelled, monthRev, compRate, avgRev, last7, maxRev, topSvc, maxSvc, retention };
  }, [appointments, barberId, thisMonth, today]);

  const { monthAppts, completed, noShows, cancelled, monthRev, compRate, avgRev, last7, maxRev, topSvc, maxSvc, retention } = stats;
  const monthLabel  = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

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
                  background: day.date === today ? C.primary : CA.ink40,
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
                <div style={{ height: "100%", width: `${(cnt / maxSvc) * 100}%`, background: C.primary, borderRadius: "2px" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Appointment status + customer retention */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "18px" }}>
          <div style={{ fontSize: "11px", color: C.secondary, fontWeight: 500, marginBottom: "14px" }}>Durum Dağılımı · {monthLabel}</div>
          {[
            { label: "Tamamlandı", count: completed.length,  color: "#15803D" },
            { label: "Gelmedi",    count: noShows.length,    color: C.primary     },
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

function BarberAvailableSlots({ barberId, appointments, barberWH }) {
  const today    = todayStr();
  const now      = nowTimeStr();
  const wh       = barberWH ?? { start: 9, end: 18 };
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
                background: isPast ? "transparent" : isBooked ? CA.ink12 : "rgba(34,197,94,0.08)",
                border: `1px solid ${isPast ? "transparent" : isBooked ? CA.ink28 : "rgba(34,197,94,0.2)"}`,
                color: isPast ? C.muted : isBooked ? "#111111" : "#15803D",
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

function Sidebar({ tab, setTab, navSections, tx, lang, setLang, handleLogout, user }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches);
  const cycleTheme = () => setTheme(isDark ? "light" : "dark");
  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4" style={{ borderBottom: `1px solid ${C.border}`, minWidth: 0 }}>
        <Link href={user?.shop?.slug ? `/${user.shop.slug}` : "/"} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", minWidth: 0, flex: 1, overflow: "hidden" }}
          onMouseEnter={(e) => { e.currentTarget.querySelector("span.name").style.color = C.primary; }}
          onMouseLeave={(e) => { e.currentTarget.querySelector("span.name").style.color = C.primary; }}
        >
          <Logo variant={isDark ? "light" : "dark"} size={22} showWordmark={false} />
          <span className="name font-display" style={{ fontSize: "13px", letterSpacing: "0.05em", color: C.primary, textTransform: "uppercase", transition: "color 0.15s", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.shop?.name ?? "Makas"}
          </span>
        </Link>
        <span className="px-1.5 py-0.5 text-[9px] tracking-widest uppercase" style={{ background: CA.ink18, color: C.primary, borderRadius: "3px", flexShrink: 0 }}>
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
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = CA.surface80; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: C.primary }} />
                    )}
                    <Icon size={14} style={{ color: active ? C.primary : C.secondary, flexShrink: 0 }} />
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
          <div style={{ width: "28px", height: "28px", background: C.primary, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "var(--makas-bg)", flexShrink: 0 }}>
            {(user?.displayName ?? user?.username ?? user?.email ?? "A").split(/[\s@]/).map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "A"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "12px", color: C.primary, fontWeight: 500, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.displayName ?? user?.username ?? "Admin"}</div>
            <div style={{ fontSize: "10px", color: C.secondary }}>{user?.role === "SUPER_ADMIN" ? "Süper Admin" : user?.role === "ADMIN" ? "Admin" : user?.role === "BARBER" ? "Berber" : "Yönetici"}</div>
          </div>
          <button onClick={handleLogout} title="Çıkış" aria-label="Çıkış" style={{ width: "36px", height: "36px", background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary, flexShrink: 0 }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Business KPIs ───────────────────────────────────────────────────────── */
function BusinessKPIs({ barberId, activeBarberCount = 0 }) {
  const { appointments } = useAppointments();
  const today = todayStr();

  const { todayAppts, completed, noshows, pending, walkIns, todayRevenue, noShowRate, effectiveBarbers, totalCap, usedSlots, chairOcc } = useMemo(() => {
    const TOTAL_SLOTS = 24;
    const todayAppts  = appointments.filter(a => a.date === today && a.status !== "cancelled" && (!barberId || a.barberId === barberId));
    const completed   = todayAppts.filter(a => a.status === "completed");
    const noshows     = todayAppts.filter(a => a.status === "noshow");
    const pending     = todayAppts.filter(a => a.status === "pending");
    const walkIns     = todayAppts.filter(a => a.isWalkIn);
    // Today's cash = sum of gross (price) on completed visits. Tips are tracked
    // separately under tipAmount but excluded from the till so they go straight
    // to the barber and not into "shop revenue today".
    const todayRevenue = completed.reduce((s, a) => s + ((a.grossAmount ?? a.price) || 0), 0);
    const noShowRate   = todayAppts.length > 0 ? Math.round((noshows.length / todayAppts.length) * 100) : 0;
    const effectiveBarbers = activeBarberCount || Math.max(new Set(todayAppts.map(a => a.barberId)).size, 1);
    const totalCap     = effectiveBarbers * TOTAL_SLOTS;
    const usedSlots    = todayAppts.reduce((s, a) => s + Math.ceil((a.duration || 30) / 30), 0);
    const chairOcc     = Math.round((usedSlots / totalCap) * 100);
    return { todayAppts, completed, noshows, pending, walkIns, todayRevenue, noShowRate, effectiveBarbers, totalCap, usedSlots, chairOcc };
  }, [appointments, today, barberId, activeBarberCount]);

  const cards = [
    { label: "Bugün Kasa",     value: `₺${todayRevenue.toLocaleString()}`, sub: `${completed.length} işlem tamamlandı`, hero: true },
    { label: "Toplam Randevu", value: todayAppts.length,                    sub: walkIns.length > 0 ? `${walkIns.length} walk-in · ${effectiveBarbers} berber` : `${effectiveBarbers} berber aktif` },
    { label: "Koltuk Doluluk", value: `${chairOcc}%`,                       sub: `${usedSlots}/${totalCap} slot`, valueColor: chairOcc > 70 ? "#15803D" : chairOcc > 40 ? "#B45309" : C.primary },
    { label: "No-Show Oranı",  value: `${noShowRate}%`,                     sub: `${noshows.length} gelmedi`,     valueColor: noShowRate > 15 ? "#DC2626" : C.primary },
    { label: "Onay Bekliyor",  value: pending.length,                       sub: pending.length > 0 ? "hemen işlem yap" : "tümü onaylandı", alert: pending.length > 0 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-[14px] p-4 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}
          style={{
            background: c.hero ? "var(--makas-ink)" : "var(--makas-surface)",
            border: c.alert ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--makas-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {c.hero && (
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          )}
          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-2"
            style={{ color: c.hero ? "var(--makas-bg)" : "var(--makas-ink-muted)", opacity: c.hero ? 0.55 : 1 }}>
            {c.label}
          </p>
          <p className="font-display font-semibold leading-none mb-1"
            style={{
              fontSize: c.hero ? "28px" : "24px",
              color: c.hero ? "var(--makas-bg)" : (c.valueColor || "var(--makas-ink)"),
              letterSpacing: "-0.02em",
            }}>
            {c.value}
          </p>
          <p className="text-[10px]" style={{ color: c.hero ? "var(--makas-bg)" : "var(--makas-ink-muted)", opacity: c.hero ? 0.45 : 1 }}>
            {c.sub}
          </p>
          {c.alert && (
            <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style={{ background: "#B45309" }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Staff Performance Cards ─────────────────────────────────────────────── */
function StaffPerformance({ barberId, realBarbers = [] }) {
  const { appointments } = useAppointments();
  const today = todayStr();
  const todayAppts = appointments.filter(a => a.date === today && a.status !== "cancelled");
  const TOTAL_SLOTS = 24;
  const visibleBarbers = barberId ? realBarbers.filter(b => b.id === barberId) : realBarbers;

  return (
    <div className="bg-card border border-border rounded-[14px] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[12px] font-semibold text-foreground">Berber Performansı</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Bugün</span>
      </div>
      <div className={`p-3 grid gap-2 ${barberId ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
        {visibleBarbers.map(b => {
          const bAppts      = todayAppts.filter(a => a.barberId === b.id);
          const bCompleted  = bAppts.filter(a => a.status === "completed");
          const bRevenue    = bCompleted.reduce((s, a) => s + ((a.grossAmount ?? a.price) || 0), 0);
          const bBarberShare = bCompleted.reduce((s, a) => s + ((a.barberAmount ?? a.price) || 0) + (a.tipAmount || 0), 0);
          const bSlots      = bAppts.reduce((s, a) => s + Math.ceil((a.duration || 30) / 30), 0);
          const util        = Math.round((bSlots / TOTAL_SLOTS) * 100);
          const pendingCt   = bAppts.filter(a => a.status === "pending").length;

          return (
            <div key={b.id} className="bg-secondary/40 rounded-[10px] p-3 border border-border">
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="flex items-center justify-center shrink-0 rounded-[7px] text-[9px] font-bold text-[var(--makas-bg)]"
                  style={{ width: "28px", height: "28px", background: "var(--makas-ink)" }}
                >
                  {b.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">
                    {(b.nameTr ?? b.name ?? "").split(" ")[0]}
                  </p>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: b.available !== false ? "#15803D" : "var(--makas-ink-muted)" }}
                    />
                    <span
                      className="text-[9px]"
                      style={{ color: b.available !== false ? "#15803D" : "var(--makas-ink-muted)" }}
                    >
                      {b.available !== false ? "Aktif" : "İzinli"}
                    </span>
                  </div>
                </div>
                {pendingCt > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] shrink-0 font-semibold"
                    style={{ background: "rgba(245,158,11,0.15)", color: "#B45309" }}>
                    {pendingCt} bekl
                  </span>
                )}
              </div>
              <div className="flex gap-3 mb-2.5 min-w-0">
                <div>
                  <p className="text-[16px] font-semibold text-foreground leading-none">{bAppts.length}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">randevu</p>
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-[16px] font-semibold leading-none truncate"
                    style={{ color: bRevenue > 0 ? "var(--makas-ink)" : "var(--makas-ink-muted)" }}>
                    ₺{bRevenue.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">brüt · ₺{bBarberShare.toLocaleString()} berber</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] text-muted-foreground">Doluluk</span>
                  <span className="text-[9px] font-semibold" style={{ color: util > 50 ? "#15803D" : "var(--makas-ink-secondary)" }}>
                    {util}%
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${util}%`, background: util > 70 ? "#15803D" : util > 40 ? "#B45309" : "var(--makas-ink)" }}
                  />
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
    <div className="flex flex-col gap-3">

      {/* Onay Bekliyor card */}
      <div
        className="bg-card rounded-[14px] overflow-hidden"
        style={{
          border: pending.length > 0 ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--makas-border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <span className="text-[12px] font-semibold text-foreground">Onay Bekliyor</span>
          {pending.length > 0
            ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px]"
                style={{ background: "rgba(245,158,11,0.15)", color: "#B45309" }}>
                {pending.length}
              </span>
            : <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px]"
                style={{ background: "rgba(34,197,94,0.1)", color: "#15803D" }}>
                <Check size={10} />
              </span>
          }
          <button
            onClick={onNewBooking}
            className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-[6px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors bg-transparent"
          >
            + Ekle
          </button>
        </div>
        {pending.length === 0 ? (
          <div className="px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Tüm randevular onaylandı.</p>
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto">
            {pending.map((appt, i) => (
              <div
                key={appt.id}
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: i < pending.length - 1 ? "1px solid var(--makas-border)" : "none" }}
              >
                <span className="font-mono-custom text-[11px] text-muted-foreground shrink-0 w-9">{appt.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{appt.client}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {appt.service}{appt.barber ? ` · ${appt.barber.split(" ")[0]}` : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => updateStatus(appt.id, "confirmed")}
                    className="flex items-center justify-center w-7 h-7 rounded-[6px]"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", color: "#15803D" }}
                    title="Onayla"
                  ><Check size={12} /></button>
                  <button
                    onClick={() => updateStatus(appt.id, "cancelled")}
                    className="flex items-center justify-center w-7 h-7 rounded-[6px]"
                    style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#991B1B" }}
                    title="İptal"
                  ><X size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Day summary card */}
      <div className="bg-card border border-border rounded-[14px] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[12px] font-semibold text-foreground">Günlük Özet</span>
          <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x divide-border">
          {[
            { label: "Kazanç",       value: `₺${revenue.toLocaleString()}`, color: revenue > 0 ? "#15803D" : undefined },
            { label: "Tamamlanan",   value: todayDone.length },
            { label: "Koltuğa Aldı", value: todayInProgress.length, color: todayInProgress.length > 0 ? "#2563EB" : undefined },
          ].map((s, i) => (
            <div key={i} className="py-3 text-center">
              <p className="font-display font-semibold text-[18px] leading-none"
                style={{ color: s.color ?? "var(--makas-ink)" }}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-[0.06em]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 ? (
          <>
            <p className="px-4 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Sıradaki · {upcoming.length}
            </p>
            {upcoming.map((appt) => {
              const isActive = appt.status === "in-progress";
              const barberInitials = appt.barber ? appt.barber.split(" ").map(w => w[0]).slice(0, 2).join("") : "?";
              return (
                <div key={appt.id} className="flex items-center gap-2 px-4 py-2 border-t border-border">
                  <span
                    className="font-mono-custom text-[11px] font-semibold shrink-0 w-10"
                    style={{ color: isActive ? "#2563EB" : "var(--makas-ink)" }}
                  >{appt.time}</span>
                  <div
                    className="flex items-center justify-center shrink-0 rounded-[4px] text-[7px] font-bold text-[var(--makas-bg)]"
                    style={{ width: "18px", height: "18px", background: "var(--makas-ink)" }}
                  >{barberInitials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-foreground truncate">{appt.client}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{appt.service}</p>
                  </div>
                  {isActive && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-[4px] shrink-0"
                      style={{ color: "#2563EB", background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
                      Devam
                    </span>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div className="px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Bugün kalan randevu yok.</p>
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
    pending:         { color: "#B45309" },
    confirmed:       { color: "#15803D" },
    "arrival-check": { color: "#7C3AED" },
    "in-progress":   { color: "#2563EB" },
    completed:       { color: "#57514B" },
    noshow:          { color: "#111111" },
    cancelled:       { color: "#52525b" },
  };

  return (
    <div className="bg-card border border-border rounded-[14px] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[12px] font-semibold text-foreground">Günün Programı</span>
        <span className="text-[11px] text-muted-foreground">{todayAppts.length} randevu</span>
      </div>
      {todayAppts.length === 0 ? (
        <DSEmptyState
          icon={Calendar}
          title="Bugün randevu yok"
          sub="İlk randevuyu eklemek için aşağıdaki butona tıkla."
          compact
          action={
            <button
              onClick={onNewBooking}
              className="text-[11px] font-medium px-3 py-1.5 rounded-[7px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors bg-transparent"
            >
              + Yeni Randevu
            </button>
          }
        />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
          {todayAppts.map((appt) => {
            const sc = SC[appt.status] ?? SC.pending;
            const barberInitials = appt.barber ? appt.barber.split(" ").map(w => w[0]).slice(0, 2).join("") : "?";
            return (
              <div key={appt.id} className="flex items-center gap-2.5 px-4 py-2.5 border-r border-b border-border">
                <span className="font-mono-custom text-[11px] font-semibold text-foreground shrink-0 w-10">{appt.time}</span>
                <div
                  className="flex items-center justify-center shrink-0 rounded-[5px] text-[7px] font-bold text-[var(--makas-bg)]"
                  style={{ width: "20px", height: "20px", background: "var(--makas-ink)" }}
                >{barberInitials}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{appt.client}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{appt.service}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sc.color }} />
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
    confirmed:       "#15803D",
    "arrival-check": "#7C3AED",
    "in-progress":   "#2563EB",
    pending:         "#B45309",
    completed:       "#57514B",
    cancelled:       "#52525b",
    noshow:          "#111111",
  };
  const STATUS_LABEL = {
    confirmed: "Onaylandı", "arrival-check": "Varış Bekleniyor", "in-progress": "Devam Ediyor",
    pending: "Bekliyor", completed: "Tamamlandı", cancelled: "İptal", noshow: "Gelmedi",
  };

  return (
    <div className="bg-card border border-border rounded-[14px] overflow-hidden h-full" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[12px] font-semibold text-foreground">Son Aktivite</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Canlı</span>
      </div>
      <div className="overflow-y-auto max-h-[360px]">
        {recent.map((appt, i) => {
          const color = STATUS_COLOR[appt.status] ?? "#57514B";
          const isToday = appt.date === today;
          const barberInitials = appt.barber ? appt.barber.split(" ").map(w => w[0]).slice(0, 2).join("") : "?";
          return (
            <div
              key={appt.id}
              className="flex items-start gap-2.5 px-4 py-3"
              style={{ borderBottom: i < recent.length - 1 ? "1px solid var(--makas-border)" : "none" }}
            >
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-medium text-foreground truncate">{appt.client}</span>
                  <span
                    className="text-[9px] font-semibold rounded-[3px] px-1.5 py-0.5 shrink-0"
                    style={{ color, background: `${color}18` }}
                  >{STATUS_LABEL[appt.status]}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{appt.service}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div
                    className="flex items-center justify-center shrink-0 rounded-[3px] text-[6px] font-bold text-[var(--makas-bg)]"
                    style={{ width: "14px", height: "14px", background: "var(--makas-ink)" }}
                  >{barberInitials}</div>
                  <span className="text-[10px] text-muted-foreground">{appt.barber?.split(" ")[0]}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span
                    className="font-mono-custom text-[10px]"
                    style={{ color: isToday ? "var(--makas-ink)" : "var(--makas-ink-muted)" }}
                  >{isToday ? appt.time : appt.date}</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-foreground shrink-0">
                {appt.price == null ? "Sorulur" : `₺${appt.price.toLocaleString()}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Overview Page ───────────────────────────────────────────────────────── */
function OverviewPage({ setTab, tx, lang, onNewBooking, onWalkIn, barberId, realBarbers = [] }) {
  const now     = new Date();
  const dateStr = now.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { weekday: "long", day: "numeric", month: "long" });
  const activeBarber = barberId ? realBarbers.find(b => b.id === barberId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground leading-tight truncate">
            {activeBarber ? (activeBarber.nameTr ?? activeBarber.name) : tx.admin.greeting}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {activeBarber ? (activeBarber.titleTr ?? activeBarber.title?.tr) : dateStr}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {onWalkIn && (
            <button
              onClick={onWalkIn}
              className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-[10px] border border-border bg-secondary text-[12px] font-semibold text-foreground hover:bg-secondary/70 transition-colors"
              title="Şimdi gelen müşteriyi kaydet"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Walk-in</span>
            </button>
          )}
          <button
            onClick={onNewBooking}
            className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-[10px] bg-foreground text-background text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">Yeni Randevu</span>
          </button>
        </div>
      </div>

      {/* Business KPIs */}
      <BusinessKPIs barberId={barberId} activeBarberCount={realBarbers.filter(b => b.available).length} />

      {/* Landing-page analytics (last 30d) */}
      {!barberId && <LandingAnalyticsPanel />}

      {/* Staff performance + Pending confirmations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_340px] gap-4">
        <StaffPerformance barberId={barberId} realBarbers={realBarbers} />
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
            className="flex items-center justify-center gap-2 h-10 rounded-[10px] bg-card border border-border text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            <Icon size={13} className="text-foreground/70" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Appointments Page ───────────────────────────────────────────────────── */
function AppointmentsPage({ tx, barberId, realBarbers = [] }) {
  const p = tx.admin.pages.appointments;
  const activeBarber = barberId ? realBarbers.find(b => b.id === barberId) : null;
  return (
    <div className="space-y-5">
      <PageHeader
        title={activeBarber ? `${activeBarber.nameTr ?? activeBarber.name} · Randevular` : p.title}
        sub={activeBarber ? (activeBarber.titleTr ?? activeBarber.title?.tr) : p.sub}
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
  const [fetchError, setFetchError] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!selectedClientId) { setClientDetail(null); return; }
    setDetailLoading(true);
    apiFetch(`/api/admin/clients/${selectedClientId}`)
      .then(data => setClientDetail(data.client ?? null))
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [selectedClientId]);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const params = new URLSearchParams({ limit: "200" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (barberId) params.set("barberId", barberId);
    apiFetch(`/api/admin/clients?${params}`)
      .then(data => { setClients(data.clients ?? []); setTotal(data.total ?? 0); })
      .catch(err => setFetchError(err.message || "Müşteri listesi yüklenemedi"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, barberId]);

  return (
    <div>
      <PageHeader
        title="Müşteriler"
        sub={loading ? "Yükleniyor…" : `${total} kayıt`}
        actions={
          <div className="flex items-center gap-2 px-3 h-9 bg-card border border-border rounded-[10px]">
            <Search size={12} className="text-muted-foreground" />
            <input
              placeholder="İsim veya telefon ara…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[12px] text-foreground placeholder:text-muted-foreground w-44"
            />
          </div>
        }
      />

      {fetchError && (
        <div className="flex items-center gap-2 rounded-[10px] bg-red-50 border border-red-200 px-4 py-3 mb-4 text-[13px] text-red-700">
          {fetchError}
        </div>
      )}

      {loading ? (
        <DSPageLoader />
      ) : clients.length === 0 ? (
        <DSEmptyState
          icon={UserX}
          title={search ? "Sonuç bulunamadı" : "Henüz müşteri yok"}
          sub={search ? `"${search}" için kayıt bulunamadı.` : "İlk randevu tamamlandığında müşteri kaydı otomatik oluşur."}
          compact
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card border border-border rounded-[14px] overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
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
                  <tr key={c.id} style={{ borderBottom: i < clients.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.surface + "80"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    onClick={() => setSelectedClientId(c.id)}
                  >
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>{c.name}</div>
                        {c.blocked && <span style={{ fontSize: "10px", color: "#111111", background: "rgba(185,28,28,0.08)", borderRadius: "4px", padding: "1px 5px" }}>Engelli</span>}
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "12px", color: C.secondary, fontFamily: "monospace" }}>{c.phone}</span></td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "13px", color: C.primary }}>{c.visits}</span></td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>₺{(c.totalSpent ?? 0).toLocaleString()}</span></td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "12px", color: c.noShows > 0 ? "#111111" : C.secondary }}>{c.noShows}</span></td>
                    <td style={{ padding: "11px 16px" }}><span style={{ fontSize: "12px", color: C.secondary }}>{c.lastVisit ?? "—"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile card list */}
          <div className="md:hidden" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
            {clients.map((c, i) => (
              <div key={c.id} style={{ padding: "14px 16px", borderBottom: i < clients.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                onClick={() => setSelectedClientId(c.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ fontSize: "14px", color: C.primary, fontWeight: 500 }}>{c.name}</div>
                      {c.blocked && <span style={{ fontSize: "10px", color: "#111111" }}>Engelli</span>}
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
                  {c.noShows > 0 && <span style={{ fontSize: "11px", color: "#111111" }}>{c.noShows} no-show</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Customer timeline drawer */}
      <AnimatePresence>
        {selectedClientId && (
          <>
            <motion.div key="cd-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" style={{ background: "rgba(17,17,17,0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => setSelectedClientId(null)} />
            <motion.div key="cd-panel"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[480px] overflow-y-auto overscroll-contain"
              style={{ background: C.card, borderLeft: `1px solid ${C.border}`, boxShadow: "-8px 0 32px rgba(17,17,17,0.12)" }}>
              {/* Drawer header */}
              <div style={{ padding: "20px 24px 18px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <h2 style={{ fontSize: "17px", fontWeight: 600, color: C.primary, margin: 0 }}>Müşteri Profili</h2>
                  <button onClick={() => setSelectedClientId(null)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
                    <X size={15} />
                  </button>
                </div>
                {clientDetail ? (
                  <>
                    <div style={{ fontSize: "20px", fontWeight: 600, color: C.primary, letterSpacing: "-0.01em", marginBottom: "2px" }}>{clientDetail.name}</div>
                    <div style={{ fontSize: "12px", color: C.secondary, fontFamily: "monospace" }}>{clientDetail.phone}</div>
                    {clientDetail.email && <div style={{ fontSize: "12px", color: C.muted, marginTop: "1px" }}>{clientDetail.email}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "14px" }}>
                      {[
                        { label: "Ziyaret",  value: clientDetail.visitCount },
                        { label: "Harcama",  value: `₺${(clientDetail.totalSpent ?? 0).toLocaleString()}` },
                        { label: "No-show",  value: clientDetail.noShowCount ?? 0 },
                      ].map(s => (
                        <div key={s.label} style={{ background: C.surface, borderRadius: "10px", padding: "10px 12px" }}>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: C.primary }}>{s.value}</div>
                          <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {clientDetail.notes && (
                      <div style={{ marginTop: "12px", padding: "10px 12px", background: "rgba(180,83,9,0.06)", borderRadius: "10px", border: "1px solid rgba(180,83,9,0.12)" }}>
                        <div style={{ fontSize: "10px", color: "#B45309", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>Not</div>
                        <div style={{ fontSize: "12px", color: C.secondary }}>{clientDetail.notes}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
                    <DSSkeleton className="h-6 w-48 rounded-md" />
                    <DSSkeleton className="h-4 w-32 rounded-md" />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "6px" }}>
                      {[1,2,3].map(i => <DSSkeleton key={i} className="h-14 rounded-[10px]" />)}
                    </div>
                  </div>
                )}
              </div>
              {/* Appointment timeline */}
              <div style={{ padding: "20px 24px" }}>
                <div className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "14px" }}>Randevu Geçmişi</div>
                {detailLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[1,2,3].map(i => <DSSkeleton key={i} className="h-16 rounded-[10px]" />)}
                  </div>
                ) : !clientDetail?.appointments?.length ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: C.muted, fontSize: "13px" }}>Henüz randevu yok</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {clientDetail.appointments.map(a => {
                      const STATUS_LABEL = { PENDING: "Bekliyor", CONFIRMED: "Onaylı", ARRIVAL_CHECK: "Varış Bekleniyor", COMPLETED: "Tamam", CANCELLED: "İptal", NOSHOW: "Gelmedi", IN_PROGRESS: "Devam Ediyor" };
                      const STATUS_COLOR = { PENDING: "#B45309", CONFIRMED: "#1D4ED8", ARRIVAL_CHECK: "#7C3AED", COMPLETED: "#15803D", CANCELLED: "#9CA3AF", NOSHOW: "#6B7280", IN_PROGRESS: "#2563EB" };
                      const st = (a.status ?? "").toUpperCase();
                      return (
                        <div key={a.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 500, color: C.primary, marginBottom: "3px" }}>{a.service?.nameTr ?? "—"}</div>
                              <div style={{ fontSize: "11px", color: C.secondary }}>{a.barber?.nameTr ?? "—"}{a.bookedByName ? ` · ${a.bookedByName}` : ""}</div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{ fontSize: "11px", color: STATUS_COLOR[st] ?? C.muted, fontWeight: 600, marginBottom: "3px" }}>{STATUS_LABEL[st] ?? st}</div>
                              {(a.price ?? 0) > 0 && <div style={{ fontSize: "11px", color: C.muted }}>₺{a.price.toLocaleString()}</div>}
                            </div>
                          </div>
                          <div className="font-mono-custom" style={{ fontSize: "10px", color: C.muted, marginTop: "6px", letterSpacing: "0.04em" }}>{a.date} {a.time}</div>
                          {a.cancellationReason && <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "4px" }}>İptal: {a.cancellationReason}</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Revenue Page ────────────────────────────────────────────────────────── */
function RevenuePage({ tx, barberId, realBarbers = [] }) {
  const { appointments } = useAppointments();
  const activeBarber = barberId ? realBarbers.find(b => b.id === barberId) : null;
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
          {activeBarber ? `${activeBarber.nameTr ?? activeBarber.name} · Gelir` : "Gelir"}
        </h1>
        <p style={{ fontSize: "12px", color: C.secondary, marginTop: "2px" }}>
          {activeBarber ? (activeBarber.titleTr ?? activeBarber.title?.tr) : "Son 30 günlük gelir analizi"}
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
      {activeBarber && <AreaChart barberId={barberId} />}
    </div>
  );
}

/* ─── Settings Page ───────────────────────────────────────────────────────── */
/* ─── Page Header ─────────────────────────────────────────────────────────── */
function PageHeader({ title, sub, actions }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground leading-tight">{title}</h1>
        {sub && <p className="text-[13px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-2 pt-0.5">{actions}</div>}
    </div>
  );
}
