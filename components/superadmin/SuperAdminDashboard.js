"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { PLANS } from "@/lib/plans";
import {
  Building2, Scissors, Calendar, TrendingUp,
  Plus, LogOut, MoreVertical, Pause, Play, Trash2, X, Pencil,
  Loader2, Search, ChevronLeft, LayoutDashboard, CreditCard,
} from "lucide-react";

const C = {
  bg:           "#F7F4EE",
  panel:        "#FFFFFF",
  border:       "#E5DED3",
  surface:      "#EFEAE2",
  ink:          "#111111",
  muted:        "#8A8480",
  dim:          "#C5BEB5",
  green:        "#1F7A3C",
  amber:        "#B45309",
  sidebar:      "#111111",
  sidebarFg:    "#F7F4EE",
  sidebarMuted: "rgba(247,244,238,0.45)",
  sidebarBorder:"rgba(247,244,238,0.1)",
  sidebarHover: "rgba(247,244,238,0.07)",
  sidebarActive:"rgba(247,244,238,0.13)",
};

const EXPANDED  = 240;
const COLLAPSED = 72;

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "shops",     label: "Salonlar",  icon: Building2 },
  { id: "analytics", label: "Analitik",  icon: TrendingUp },
];

function fmtTRY(n) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function SuperAdminDashboard() {
  const { user, role, loaded, logout } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage]           = useState("dashboard");
  const [stats, setStats]         = useState(null);
  const [shops, setShops]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editShop, setEditShop]     = useState(null);
  const [billingShop, setBillingShop] = useState(null);

  useEffect(() => {
    if (!loaded) return;
    if (role !== "superadmin") router.replace("/superadmin/login");
  }, [loaded, role, router]);

  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [s, list] = await Promise.all([
        apiFetch("/api/superadmin/stats"),
        apiFetch("/api/superadmin/shops"),
      ]);
      setStats(s); setShops(list);
    } catch (e) { setError(e.message || "Yükleme hatası"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (role === "superadmin") reload(); }, [role, reload]);

  const handleLogout = async () => { await logout(); router.push("/superadmin/login"); };

  const toggleStatus = async (shop) => {
    const next = shop.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await apiFetch(`/api/superadmin/shops/${shop.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      reload();
    } catch (e) { alert(e.message || "İşlem başarısız"); }
  };

  const deleteShop = async (shop) => {
    if (!confirm(`"${shop.name}" salonunu ve tüm verilerini silmek üzeresin. Devam edilsin mi?`)) return;
    try {
      await apiFetch(`/api/superadmin/shops/${shop.id}`, { method: "DELETE" });
      reload();
    } catch (e) { alert(e.message || "Silme başarısız"); }
  };

  if (!loaded || role !== "superadmin") return null;

  const sidebarW = collapsed ? COLLAPSED : EXPANDED;

  const filtered = shops.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: C.bg, overflowX: "hidden" }}>

      {/* ──────────── Desktop sidebar ──────────── */}
      <aside style={{
        width: sidebarW,
        minWidth: sidebarW,
        flexShrink: 0,
        background: C.sidebar,
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.22s ease, min-width 0.22s ease",
        overflowX: "hidden",
        overflowY: "auto",
      }} className="no-scrollbar sa-sidebar">

        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "18px 0" : "18px 16px", justifyContent: collapsed ? "center" : "flex-start", borderBottom: `1px solid ${C.sidebarBorder}`, minHeight: 60, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, background: "rgba(247,244,238,0.1)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={15} color={C.sidebarFg} />
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden", minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.sidebarFg, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>MAKAS</div>
              <div style={{ fontSize: 9, color: C.sidebarMuted, letterSpacing: "0.18em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Super Admin</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 0" }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => setPage(id)} title={collapsed ? label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "11px 0" : "11px 16px", justifyContent: collapsed ? "center" : "flex-start", background: active ? C.sidebarActive : "transparent", border: "none", cursor: "pointer", position: "relative", transition: "background 0.13s" }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.sidebarHover; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? C.sidebarActive : "transparent"; }}
              >
                {active && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: C.sidebarFg, borderRadius: "0 3px 3px 0" }} />}
                <Icon size={17} color={active ? C.sidebarFg : C.sidebarMuted} style={{ flexShrink: 0 }} />
                {!collapsed && <span style={{ fontSize: 13, color: active ? C.sidebarFg : C.sidebarMuted, fontWeight: active ? 500 : 400, whiteSpace: "nowrap" }}>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: "14px", borderTop: `1px solid ${C.sidebarBorder}`, display: "flex", justifyContent: collapsed ? "center" : "flex-end", flexShrink: 0 }}>
          <button onClick={() => setCollapsed(c => !c)} title={collapsed ? "Genişlet" : "Daralt"}
            style={{ width: 30, height: 30, background: "rgba(247,244,238,0.08)", border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={15} color={C.sidebarMuted} style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.22s ease" }} />
          </button>
        </div>
      </aside>

      {/* ──────────── Main content ──────────── */}
      <div style={{
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        marginLeft: sidebarW,
        width: `calc(100vw - ${sidebarW}px)`,
        transition: "margin-left 0.22s ease, width 0.22s ease",
      }} className="sa-main">

        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(248,246,242,0.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}`, height: 56, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, letterSpacing: "-0.01em" }}>
              {NAV.find(n => n.id === page)?.label ?? "Dashboard"}
            </span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }} className="hidden sm:block">
            {user?.email}
          </div>
          <button onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: C.ink, background: C.surface, border: "none", cursor: "pointer", flexShrink: 0, height: 36 }}>
            <LogOut size={14} /> <span className="hidden sm:inline">Çıkış</span>
          </button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: "20px 16px 80px", minWidth: 0, overflowX: "hidden" }}>
          {page === "dashboard" || page === "shops" ? (
            <DashboardContent
              stats={stats} shops={shops} filtered={filtered} loading={loading} error={error}
              search={search} setSearch={setSearch}
              toggleStatus={toggleStatus} deleteShop={deleteShop}
              onNew={() => setCreateOpen(true)}
              onEdit={setEditShop}
              onBilling={setBillingShop}
              showKpis={page === "dashboard"}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "80px 0", color: C.muted, fontSize: 14 }}>Bu bölüm yakında gelecek.</div>
          )}
        </main>
      </div>

      {/* ──────────── Mobile bottom tab bar ──────────── */}
      <nav style={{
        display: "none",
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        background: C.sidebar,
        borderTop: `1px solid ${C.sidebarBorder}`,
        zIndex: 40,
        paddingBottom: "env(safe-area-inset-bottom)",
      }} className="sa-bottomnav">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 0", background: "transparent", border: "none", cursor: "pointer" }}>
              <Icon size={20} color={active ? C.sidebarFg : C.sidebarMuted} />
              <span style={{ fontSize: 10, color: active ? C.sidebarFg : C.sidebarMuted, letterSpacing: "0.02em", fontWeight: active ? 600 : 400 }}>{label}</span>
              {active && <div style={{ position: "absolute", top: 0, width: 24, height: 2, background: C.sidebarFg, borderRadius: "0 0 2px 2px" }} />}
            </button>
          );
        })}
        <button onClick={handleLogout}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: "10px 0", background: "transparent", border: "none", cursor: "pointer" }}>
          <LogOut size={20} color={C.sidebarMuted} />
          <span style={{ fontSize: 10, color: C.sidebarMuted }}>Çıkış</span>
        </button>
      </nav>

      {createOpen && (
        <CreateShopModal onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); reload(); }} />
      )}
      {editShop && (
        <EditShopModal shop={editShop} onClose={() => setEditShop(null)} onSaved={() => { setEditShop(null); reload(); }} />
      )}
      {billingShop && (
        <BillingModal shop={billingShop} onClose={() => setBillingShop(null)} onSaved={() => { setBillingShop(null); reload(); }} />
      )}
    </div>
  );
}

/* ── Dashboard page content ── */
function DashboardContent({ stats, shops, filtered, loading, error, search, setSearch, toggleStatus, deleteShop, onNew, onEdit, onBilling, showKpis }) {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      {showKpis && (
        <>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Platform Yönetimi</h1>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Tüm salonlar, kullanıcılar ve gelir.</p>
            </div>
            <button onClick={onNew}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500, background: C.ink, color: "#fff", border: "none", cursor: "pointer", flexShrink: 0 }}>
              <Plus size={14} /> Yeni Salon
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
            <Kpi icon={Building2}  label="Toplam Salon"    value={stats?.totalShops ?? "—"}            sub={stats ? `${stats.activeShops} aktif` : ""} />
            <Kpi icon={Scissors}   label="Berberler"       value={stats?.totalBarbers ?? "—"} />
            <Kpi icon={Calendar}   label="Bu Ay Randevu"   value={stats?.monthlyAppointments ?? "—"} />
            <Kpi icon={TrendingUp} label="Bu Ay Gelir"     value={stats ? fmtTRY(stats.monthlyRevenue) : "—"} />
            <Kpi
              icon={CreditCard}
              label="Tahmini MRR"
              value={fmtTRY(shops.reduce((acc, s) => s.subscriptionStatus === "ACTIVE" ? acc + (PLANS[s.planTier]?.priceMonthlyTry ?? 0) : acc, 0))}
              sub={`${shops.filter(s => s.subscriptionStatus === "TRIAL").length} deneme · ${shops.filter(s => s.subscriptionStatus === "PAST_DUE").length} gecikmiş`}
            />
          </div>
        </>
      )}

      {/* Shops card — NO overflow:hidden so dropdown isn't clipped */}
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14 }}>
        {/* Card header */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderRadius: "14px 14px 0 0" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Salonlar</h2>
            <p style={{ fontSize: 11, color: C.muted }}>{shops.length} salon</p>
          </div>
          {!showKpis && (
            <button onClick={onNew}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 500, background: C.ink, color: "#fff", border: "none", cursor: "pointer", flexShrink: 0 }}>
              <Plus size={13} /> Yeni Salon
            </button>
          )}
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Salon ara…"
              style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6, fontSize: 13, borderRadius: 7, outline: "none", background: C.surface, color: C.ink, border: `1px solid ${C.border}`, width: "min(190px, 100%)" }} />
          </div>
        </div>

        {loading && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "56px 20px", color: C.muted }}><Loader2 size={15} className="animate-spin" /> Yükleniyor…</div>}
        {error && !loading && <div style={{ padding: "40px 16px", textAlign: "center", fontSize: 13, color: C.ink }}>{error}</div>}
        {!loading && !error && filtered.length === 0 && <div style={{ padding: "56px 16px", textAlign: "center", fontSize: 13, color: C.muted }}>Salon bulunamadı.</div>}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="sa-table" style={{ overflowX: "auto", borderRadius: "0 0 14px 14px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 520 }}>
                <thead>
                  <tr style={{ background: C.surface }}>
                    <Th>Salon</Th>
                    <Th>Slug</Th>
                    <Th align="right">Berber</Th>
                    <Th align="right">Randevu</Th>
                    <Th>Abonelik</Th>
                    <Th>Durum</Th>
                    <Th align="right" style={{ width: 40 }}></Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <Td>
                        <div style={{ fontWeight: 500, color: C.ink, whiteSpace: "nowrap" }}>{s.name}</div>
                        {s.address && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{s.address}</div>}
                      </Td>
                      <Td><code style={{ fontSize: 11, color: C.muted }}>{s.slug}</code></Td>
                      <Td align="right">{s._count.barbers}</Td>
                      <Td align="right">{s._count.appointments}</Td>
                      <Td>
                        <SubscriptionBadge status={s.subscriptionStatus} />
                        <SubscriptionEndHint shop={s} />
                      </Td>
                      <Td><StatusBadge status={s.status} /></Td>
                      <Td align="right">
                        <ActionMenu shop={s} onToggle={() => toggleStatus(s)} onDelete={() => deleteShop(s)} onEdit={() => onEdit(s)} onBilling={() => onBilling(s)} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sa-cards" style={{ display: "none" }}>
              {filtered.map((s) => (
                <div key={s.id} style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{s.name}</span>
                      <StatusBadge status={s.status} />
                      <SubscriptionBadge status={s.subscriptionStatus} />
                    </div>
                    <SubscriptionEndHint shop={s} />
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                      <code>{s.slug}</code>
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.muted }}>
                      <span>{s._count.barbers} berber</span>
                      <span>{s._count.appointments} randevu</span>
                    </div>
                  </div>
                  <ActionMenu shop={s} onToggle={() => toggleStatus(s)} onDelete={() => deleteShop(s)} onEdit={() => onEdit(s)} onBilling={() => onBilling(s)} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Dropdown with fixed positioning — never clipped by table overflow */
function ActionMenu({ shop, onToggle, onDelete, onEdit, onBilling }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, right: 0 });
  const btnRef          = useRef(null);

  const openMenu = (e) => {
    e.stopPropagation();
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
    setOpen(true);
  };

  return (
    <>
      <button ref={btnRef} onClick={openMenu}
        style={{ padding: 6, borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          {/* Invisible overlay catches outside clicks */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 70 }} />
          <div style={{
            position: "fixed",
            top: pos.top,
            right: pos.right,
            zIndex: 71,
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 170,
            overflow: "hidden",
          }}>
          <MenuItem onClick={() => { setOpen(false); onEdit(); }}>
            <Pencil size={14} /> Düzenle
          </MenuItem>
          <MenuItem onClick={() => { setOpen(false); onBilling(); }}>
            <CreditCard size={14} /> Abonelik
          </MenuItem>
          <MenuItem onClick={() => { setOpen(false); onToggle(); }}>
            {shop.status === "ACTIVE" ? <><Pause size={14} /> Askıya al</> : <><Play size={14} /> Aktifleştir</>}
          </MenuItem>
          <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
          <MenuItem onClick={() => { setOpen(false); onDelete(); }} danger>
            <Trash2 size={14} /> Salonu sil
          </MenuItem>
        </div>
        </>
      )}
    </>
  );
}

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.muted, marginBottom: 8 }}><Icon size={12} /> {label}</div>
      <div style={{ fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Th({ children, align = "left", style: s }) {
  return <th style={{ padding: "9px 14px", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, textAlign: align, whiteSpace: "nowrap", ...s }}>{children}</th>;
}
function Td({ children, align = "left" }) {
  return <td style={{ padding: "11px 14px", textAlign: align, color: C.ink, verticalAlign: "middle" }}>{children}</td>;
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE:    { label: "Aktif",  color: C.green, bg: "rgba(31,122,60,0.08)" },
    SUSPENDED: { label: "Askıda", color: C.amber, bg: "rgba(180,83,9,0.08)"  },
  };
  const s = map[status] ?? { label: status, color: C.muted, bg: C.surface };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, whiteSpace: "nowrap" }}>{s.label}</span>;
}

function SubscriptionBadge({ status }) {
  const map = {
    TRIAL:     { label: "Deneme",   color: "#1E40AF", bg: "rgba(30,64,175,0.08)" },
    ACTIVE:    { label: "Aktif",    color: C.green,    bg: "rgba(31,122,60,0.08)" },
    PAST_DUE:  { label: "Gecikmiş", color: C.amber,    bg: "rgba(180,83,9,0.08)"  },
    SUSPENDED: { label: "Askıda",   color: "#991B1B", bg: "rgba(153,27,27,0.08)" },
    CANCELLED: { label: "İptal",    color: C.muted,    bg: C.surface },
  };
  const s = map[status] ?? { label: status ?? "—", color: C.muted, bg: C.surface };
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, whiteSpace: "nowrap" }}>{s.label}</span>;
}

// ponytail: end-date hint shown under SubscriptionBadge in the shop list.
// Picks trialEndsAt for TRIAL, currentPeriodEndsAt otherwise.
function SubscriptionEndHint({ shop }) {
  const end = shop.subscriptionStatus === "TRIAL" ? shop.trialEndsAt : shop.currentPeriodEndsAt;
  if (!end) return null;
  const ms = new Date(end).getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  const dateStr = new Date(end).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
  const color = days < 0 ? "#991B1B" : days <= 3 ? C.amber : C.muted;
  const tail = days < 0 ? `${Math.abs(days)}g gecikti` : days === 0 ? "bugün" : `${days}g kaldı`;
  return (
    <div style={{ fontSize: 10, color, marginTop: 3, whiteSpace: "nowrap" }}>
      {dateStr} · {tail}
    </div>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button onClick={onClick}
      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", fontSize: 13, textAlign: "left", background: "transparent", border: "none", cursor: "pointer", color: danger ? "#B91C1C" : C.ink }}
      onMouseEnter={e => { e.currentTarget.style.background = C.surface; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      {children}
    </button>
  );
}

/* ── Create shop modal ── */
function CreateShopModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ slug: "", name: "", address: "", phone: "", email: "", adminEmail: "", adminPassword: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { await apiFetch("/api/superadmin/shops", { method: "POST", body: JSON.stringify(form) }); onCreated(); }
    catch (e2) { setErr(e2.message || "Oluşturma başarısız"); }
    finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} className="sa-modal-backdrop">
      <div onClick={e => e.stopPropagation()} className="sa-modal-sheet"
        style={{ width: "100%", maxWidth: 500, background: C.panel, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}
      >
        <div className="sa-drag-handle" style={{ justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.dim }} />
        </div>

        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Yeni Salon</h3>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>Salon ve admin hesabı birlikte oluşturulur.</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, background: C.surface, border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, flexShrink: 0 }}><X size={15} /></button>
        </div>

        <form onSubmit={submit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Slug *" hint="küçük harf, rakam, tire"><input required value={form.slug} onChange={set("slug")} placeholder="ornek-salon" style={fi} /></Field>
            <Field label="İsim *"><input required value={form.name} onChange={set("name")} placeholder="Örnek Salon" style={fi} /></Field>
          </div>
          <Field label="Adres"><input value={form.address} onChange={set("address")} style={fi} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Telefon"><input value={form.phone} onChange={set("phone")} style={fi} /></Field>
            <Field label="Salon E-posta"><input type="email" value={form.email} onChange={set("email")} style={fi} /></Field>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: C.muted, paddingTop: 4 }}>İlk Admin Hesabı</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Admin E-posta *"><input required type="email" value={form.adminEmail} onChange={set("adminEmail")} placeholder="admin@ornek.com" style={fi} /></Field>
            <Field label="Admin Şifre *" hint="Min 6 karakter"><input required type="password" value={form.adminPassword} onChange={set("adminPassword")} style={fi} /></Field>
          </div>
          {err && <div style={{ fontSize: 12, padding: "8px 10px", borderRadius: 7, color: "#B91C1C", background: "rgba(185,28,28,0.06)" }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, color: C.ink, background: C.surface, border: "none", cursor: "pointer" }}>İptal</button>
            <button type="submit" disabled={busy} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: C.ink, color: "#fff", border: "none", cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
              {busy && <Loader2 size={13} className="animate-spin" />} Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Edit shop modal ── */
function EditShopModal({ shop, onClose, onSaved }) {
  const [form, setForm] = useState({ name: shop.name, slug: shop.slug, status: shop.status });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try {
      await apiFetch(`/api/superadmin/shops/${shop.id}`, { method: "PATCH", body: JSON.stringify(form) });
      onSaved();
    } catch (e2) { setErr(e2.message || "Güncelleme başarısız"); }
    finally { setBusy(false); }
  };

  return (
    <div onClick={onClose} className="sa-modal-backdrop">
      <div onClick={e => e.stopPropagation()} className="sa-modal-sheet"
        style={{ width: "100%", maxWidth: 420, background: C.panel, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}
      >
        <div className="sa-drag-handle" style={{ justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.dim }} />
        </div>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Salonu Düzenle</h3>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{shop.name}</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, background: C.surface, border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}><X size={15} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
          <Field label="Salon Adı *">
            <input required value={form.name} onChange={set("name")} style={fi} />
          </Field>
          <Field label="Slug *" hint="Değiştirirsen mevcut linkler bozulur">
            <input required value={form.slug} onChange={set("slug")} style={fi} />
          </Field>
          <Field label="Durum">
            <select value={form.status} onChange={set("status")} style={{ ...fi, cursor: "pointer" }}>
              <option value="ACTIVE">Aktif</option>
              <option value="SUSPENDED">Askıda</option>
            </select>
          </Field>
          {err && <div style={{ fontSize: 12, padding: "8px 10px", borderRadius: 7, color: "#B91C1C", background: "rgba(185,28,28,0.06)" }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 8, fontSize: 13, color: C.ink, background: C.surface, border: "none", cursor: "pointer" }}>İptal</button>
            <button type="submit" disabled={busy} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: C.ink, color: "#fff", border: "none", cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
              {busy && <Loader2 size={13} className="animate-spin" />} Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Billing / subscription modal (manual sales-led billing) ── */
function BillingModal({ shop, onClose, onSaved }) {
  const [subscriptionStatus, setSubscriptionStatus] = useState(shop.subscriptionStatus ?? "TRIAL");
  const [extendDays, setExtendDays] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const submit = async (body) => {
    setBusy(true); setErr("");
    try {
      await apiFetch(`/api/superadmin/shops/${shop.id}`, { method: "PATCH", body: JSON.stringify(body) });
      onSaved();
    } catch (e) { setErr(e.message || "Güncelleme başarısız"); }
    finally { setBusy(false); }
  };

  const saveStatus = (e) => {
    e.preventDefault();
    if (subscriptionStatus === shop.subscriptionStatus) { onClose(); return; }
    submit({ subscriptionStatus });
  };

  const extend = (n) => submit({ extendDays: n });

  const customExtend = (e) => {
    e.preventDefault();
    const n = Number(extendDays);
    if (!Number.isFinite(n) || n <= 0) { setErr("Gün sayısı 1+ olmalı"); return; }
    submit({ extendDays: n });
  };

  return (
    <div onClick={onClose} className="sa-modal-backdrop">
      <div onClick={e => e.stopPropagation()} className="sa-modal-sheet"
        style={{ width: "100%", maxWidth: 460, background: C.panel, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column" }}
      >
        <div className="sa-drag-handle" style={{ justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.dim }} />
        </div>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Abonelik Yönet</h3>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{shop.name}</p>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, background: C.surface, border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}><X size={15} /></button>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
          {/* Period summary */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
            <div>
              <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Deneme bitiş</div>
              <div style={{ color: C.ink, marginTop: 2 }}>{fmtDate(shop.trialEndsAt)}</div>
              {!shop.trialEndsAt && (
                <button onClick={() => submit({ startTrialDays: 14 })} disabled={busy}
                  style={{ marginTop: 6, padding: "5px 9px", borderRadius: 6, fontSize: 11, fontWeight: 500, background: C.ink, color: "#fff", border: "none", cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                  14 gün başlat
                </button>
              )}
            </div>
            <div>
              <div style={{ color: C.muted, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dönem bitiş</div>
              <div style={{ color: C.ink, marginTop: 2 }}>{fmtDate(shop.currentPeriodEndsAt)}</div>
            </div>
          </div>

          <form onSubmit={saveStatus} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Abonelik Durumu">
              <select value={subscriptionStatus} onChange={(e) => setSubscriptionStatus(e.target.value)} style={{ ...fi, cursor: "pointer" }}>
                <option value="TRIAL">Deneme</option>
                <option value="ACTIVE">Aktif</option>
                <option value="PAST_DUE">Gecikmiş</option>
                <option value="SUSPENDED">Askıda</option>
                <option value="CANCELLED">İptal</option>
              </select>
            </Field>
            <button type="submit" disabled={busy} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: C.ink, color: "#fff", border: "none", cursor: "pointer", opacity: busy ? 0.7 : 1 }}>
              {busy && <Loader2 size={13} className="animate-spin" />} Kaydet
            </button>
          </form>

          <div style={{ height: 1, background: C.border }} />

          {/* Period extension — payment received */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginBottom: 4 }}>Süreyi Uzat</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>Ödeme alındıysa dönem bitişine ekle. Otomatik olarak ACTIVE'e çekilir.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
              {[30, 90, 365].map(n => (
                <button key={n} onClick={() => extend(n)} disabled={busy}
                  style={{ padding: "9px 0", borderRadius: 7, fontSize: 12, fontWeight: 500, background: C.surface, color: C.ink, border: `1px solid ${C.border}`, cursor: "pointer", opacity: busy ? 0.6 : 1 }}>
                  +{n} gün
                </button>
              ))}
            </div>
            <form onSubmit={customExtend} style={{ display: "flex", gap: 6 }}>
              <input type="number" min="1" max="3650" placeholder="Özel gün sayısı" value={extendDays} onChange={(e) => setExtendDays(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", fontSize: 12, borderRadius: 7, background: C.surface, color: C.ink, border: `1px solid ${C.border}`, outline: "none" }} />
              <button type="submit" disabled={busy || !extendDays}
                style={{ padding: "8px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, background: C.ink, color: "#fff", border: "none", cursor: "pointer", opacity: (busy || !extendDays) ? 0.5 : 1 }}>
                Ekle
              </button>
            </form>
          </div>

          {err && <div style={{ fontSize: 12, padding: "8px 10px", borderRadius: 7, color: "#B91C1C", background: "rgba(185,28,28,0.06)" }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}

const fi = { width: "100%", padding: "8px 10px", fontSize: 13, background: "transparent", border: "none", outline: "none", color: C.ink, boxSizing: "border-box" };
function Field({ label, hint, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: C.ink, marginBottom: 3 }}>{label}</div>
      <div style={{ borderRadius: 7, background: C.surface, border: `1px solid ${C.border}`, overflow: "hidden" }}>{children}</div>
      {hint && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{hint}</div>}
    </label>
  );
}
