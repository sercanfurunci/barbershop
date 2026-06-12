"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import {
  Building2, Users, Scissors, Calendar, TrendingUp,
  Plus, LogOut, MoreVertical, Pause, Play, Trash2, X, Loader2, Search,
} from "lucide-react";

const C = {
  bg:       "#F8F6F2",
  panel:    "#FFFFFF",
  border:   "rgba(17,17,17,0.08)",
  surface:  "#F1EEE8",
  ink:      "#111111",
  muted:    "#6E6760",
  dim:      "#C9C2B7",
  green:    "#1F7A3C",
  amber:    "#B45309",
  red:      "#C62828",
};

function fmtTRY(n) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n ?? 0);
}

export default function SuperAdminDashboard() {
  const { user, role, loaded, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [menuFor, setMenuFor] = useState(null);

  // Role gate
  useEffect(() => {
    if (!loaded) return;
    if (role !== "superadmin") router.replace("/barber");
  }, [loaded, role, router]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, list] = await Promise.all([
        apiFetch("/api/superadmin/stats"),
        apiFetch("/api/superadmin/shops"),
      ]);
      setStats(s);
      setShops(list);
    } catch (e) {
      setError(e.message || "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "superadmin") reload();
  }, [role, reload]);

  const handleLogout = async () => { await logout(); router.push("/barber"); };

  const toggleStatus = async (shop) => {
    const next = shop.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await apiFetch(`/api/superadmin/shops/${shop.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      setMenuFor(null);
      reload();
    } catch (e) {
      alert(e.message || "İşlem başarısız");
    }
  };

  const deleteShop = async (shop) => {
    if (!confirm(`"${shop.name}" salonunu ve tüm verilerini silmek üzeresin. Devam edilsin mi?`)) return;
    try {
      await apiFetch(`/api/superadmin/shops/${shop.id}`, { method: "DELETE" });
      setMenuFor(null);
      reload();
    } catch (e) {
      alert(e.message || "Silme başarısız");
    }
  };

  if (!loaded || role !== "superadmin") return null;

  const filtered = shops.filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 backdrop-blur"
        style={{ background: "rgba(248,246,242,0.85)", borderBottom: `1px solid ${C.border}` }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: C.ink, color: "#fff" }}
            >
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>MAKAS</div>
              <div className="text-[11px] tracking-wide" style={{ color: C.muted }}>SUPER ADMIN</div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="hidden sm:block text-[13px]" style={{ color: C.muted }}>
            {user?.email}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{ color: C.ink, background: C.surface }}
          >
            <LogOut size={14} /> Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Title row */}
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight leading-tight" style={{ color: C.ink }}>
              Platform Yönetimi
            </h1>
            <p className="text-[14px] mt-1" style={{ color: C.muted }}>
              Tüm salonlar, kullanıcılar ve gelir.
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[14px] font-medium transition-colors"
            style={{ background: C.ink, color: "#fff" }}
          >
            <Plus size={16} /> Yeni Salon
          </button>
        </div>

        {/* KPI grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Kpi icon={Building2} label="Toplam Salon" value={stats?.totalShops ?? "—"} sub={stats ? `${stats.activeShops} aktif · ${stats.suspendedShops} askıda` : ""} />
          <Kpi icon={Scissors}  label="Berberler"   value={stats?.totalBarbers ?? "—"} />
          <Kpi icon={Calendar}  label="Bu Ay Randevu" value={stats?.monthlyAppointments ?? "—"} sub={stats ? `${stats.totalAppointments} toplam` : ""} />
          <Kpi icon={TrendingUp} label="Bu Ay Gelir" value={stats ? fmtTRY(stats.monthlyRevenue) : "—"} sub={stats ? `${fmtTRY(stats.totalRevenue)} toplam` : ""} />
        </section>

        {/* Shops table */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: C.panel, border: `1px solid ${C.border}` }}
        >
          <div className="px-5 py-4 flex items-center gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div>
              <h2 className="text-[16px] font-semibold tracking-tight" style={{ color: C.ink }}>Salonlar</h2>
              <p className="text-[12px]" style={{ color: C.muted }}>{shops.length} salon</p>
            </div>
            <div className="flex-1" />
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Salon ara…"
                className="pl-9 pr-3 py-2 text-[13px] rounded-lg outline-none"
                style={{ background: C.surface, color: C.ink, border: `1px solid ${C.border}`, width: 220 }}
              />
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-16" style={{ color: C.muted }}>
              <Loader2 size={16} className="animate-spin" /> Yükleniyor…
            </div>
          )}

          {error && !loading && (
            <div className="px-5 py-10 text-center text-[13px]" style={{ color: C.red }}>{error}</div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="px-5 py-16 text-center text-[13px]" style={{ color: C.muted }}>
              Salon bulunamadı.
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead style={{ background: C.surface }}>
                  <tr style={{ color: C.muted }}>
                    <Th>Salon</Th>
                    <Th>Slug</Th>
                    <Th align="right">Berber</Th>
                    <Th align="right">Hizmet</Th>
                    <Th align="right">Randevu</Th>
                    <Th align="right">Kullanıcı</Th>
                    <Th>Durum</Th>
                    <Th align="right">İşlem</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} style={{ borderTop: `1px solid ${C.border}` }}>
                      <Td>
                        <div className="font-medium" style={{ color: C.ink }}>{s.name}</div>
                        {s.address && <div className="text-[11px]" style={{ color: C.muted }}>{s.address}</div>}
                      </Td>
                      <Td><code className="text-[12px]" style={{ color: C.muted }}>{s.slug}</code></Td>
                      <Td align="right">{s._count.barbers}</Td>
                      <Td align="right">{s._count.services}</Td>
                      <Td align="right">{s._count.appointments}</Td>
                      <Td align="right">{s._count.users}</Td>
                      <Td><StatusBadge status={s.status} /></Td>
                      <Td align="right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setMenuFor(menuFor === s.id ? null : s.id)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: C.muted }}
                            aria-label="İşlemler"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {menuFor === s.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                              <div
                                className="absolute right-0 mt-1 z-20 rounded-lg overflow-hidden min-w-[180px]"
                                style={{ background: C.panel, border: `1px solid ${C.border}`, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                              >
                                <MenuItem onClick={() => toggleStatus(s)}>
                                  {s.status === "ACTIVE" ? <><Pause size={14} /> Askıya al</> : <><Play size={14} /> Aktifleştir</>}
                                </MenuItem>
                                <MenuItem onClick={() => deleteShop(s)} danger>
                                  <Trash2 size={14} /> Salonu sil
                                </MenuItem>
                              </div>
                            </>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {createOpen && (
        <CreateShopModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); reload(); }}
        />
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-2 text-[12px] mb-3" style={{ color: C.muted }}>
        <Icon size={14} /> {label}
      </div>
      <div className="text-[22px] sm:text-[26px] font-semibold tracking-tight" style={{ color: C.ink }}>
        {value}
      </div>
      {sub && <div className="text-[11px] mt-1" style={{ color: C.muted }}>{sub}</div>}
    </div>
  );
}

function Th({ children, align = "left" }) {
  return (
    <th
      className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}
function Td({ children, align = "left" }) {
  return <td className="px-4 py-3 align-top" style={{ textAlign: align, color: C.ink }}>{children}</td>;
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE:    { label: "Aktif",   color: C.green, bg: "rgba(31,122,60,0.08)" },
    SUSPENDED: { label: "Askıda",  color: C.amber, bg: "rgba(180,83,9,0.08)"  },
  };
  const s = map[status] ?? { label: status, color: C.muted, bg: C.surface };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors hover:bg-black/[0.04]"
      style={{ color: danger ? C.red : C.ink }}
    >
      {children}
    </button>
  );
}

function CreateShopModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    slug: "", name: "", address: "", phone: "", email: "",
    adminEmail: "", adminPassword: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await apiFetch("/api/superadmin/shops", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onCreated();
    } catch (e2) {
      setErr(e2.message || "Oluşturma başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(17,17,17,0.45)" }}>
      <div
        className="w-full max-w-[520px] rounded-2xl overflow-hidden"
        style={{ background: C.panel, border: `1px solid ${C.border}` }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h3 className="text-[16px] font-semibold tracking-tight" style={{ color: C.ink }}>Yeni Salon</h3>
            <p className="text-[12px]" style={{ color: C.muted }}>Salon ve ilk admin hesabı birlikte oluşturulur.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md" style={{ color: C.muted }}><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="px-5 py-5 space-y-3">
          <Row>
            <Field label="Slug *" hint="3–31 karakter · küçük harf, rakam, tire">
              <input required value={form.slug} onChange={set("slug")} placeholder="ornek-salon" className={inputCls} />
            </Field>
            <Field label="İsim *">
              <input required value={form.name} onChange={set("name")} placeholder="Örnek Salon" className={inputCls} />
            </Field>
          </Row>
          <Field label="Adres">
            <input value={form.address} onChange={set("address")} className={inputCls} />
          </Field>
          <Row>
            <Field label="Telefon">
              <input value={form.phone} onChange={set("phone")} className={inputCls} />
            </Field>
            <Field label="Salon E-posta">
              <input type="email" value={form.email} onChange={set("email")} className={inputCls} />
            </Field>
          </Row>

          <div className="pt-2 pb-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: C.muted }}>
            İlk Admin Hesabı
          </div>
          <Row>
            <Field label="Admin E-posta *">
              <input required type="email" value={form.adminEmail} onChange={set("adminEmail")} placeholder="admin@ornek.com" className={inputCls} />
            </Field>
            <Field label="Admin Şifre *" hint="Min 6 karakter">
              <input required type="password" value={form.adminPassword} onChange={set("adminPassword")} className={inputCls} />
            </Field>
          </Row>

          {err && <div className="text-[12px] px-3 py-2 rounded-md" style={{ color: C.red, background: "rgba(198,40,40,0.08)" }}>{err}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px]" style={{ color: C.ink, background: C.surface }}>
              İptal
            </button>
            <button type="submit" disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium" style={{ background: C.ink, color: "#fff", opacity: busy ? 0.7 : 1 }}>
              {busy && <Loader2 size={14} className="animate-spin" />}
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 text-[13px] rounded-lg outline-none";

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium mb-1" style={{ color: C.ink }}>{label}</div>
      <div className="rounded-lg" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {children}
      </div>
      {hint && <div className="text-[11px] mt-1" style={{ color: C.muted }}>{hint}</div>}
    </label>
  );
}

function Row({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
