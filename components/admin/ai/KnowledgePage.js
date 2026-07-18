"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAdminTab } from "@/contexts/AdminTabContext";
import {
  Plus, Trash2, Save, X, BookOpen, ToggleLeft, ToggleRight, Search,
  ChevronDown, ChevronRight, Database, Users, Clock, Calendar, CreditCard, Info,
  ArrowUpRight, AlertTriangle, CheckCircle2, Zap, Star, Scissors, RefreshCw,
  Phone, MapPin, Globe, Wifi, ParkingCircle, Wind,
  Baby, Accessibility, Building2, Coffee, Link2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader, DSSkeleton } from "@/components/ds";

// Only custom AI-only categories (dynamic DB data is shown automatically)
const CUSTOM_CATEGORIES = [
  { value: "FAQ",       label: "Sık Sorulan Sorular" },
  { value: "POLICY",    label: "Politikalar" },
  { value: "CAMPAIGN",  label: "Kampanyalar" },
  { value: "NOTES",     label: "Notlar" },
];
const CATEGORY_LABEL = Object.fromEntries(CUSTOM_CATEGORIES.map(c => [c.value, c.label]));
const EMPTY_FORM = { category: "FAQ", title: "", content: "", tags: "", enabled: true, sortOrder: 0 };

const DAYS = [
  { key: "mon", label: "Pzt", full: "Pazartesi",  dow: 1 },
  { key: "tue", label: "Sal", full: "Salı",       dow: 2 },
  { key: "wed", label: "Çar", full: "Çarşamba",   dow: 3 },
  { key: "thu", label: "Per", full: "Perşembe",   dow: 4 },
  { key: "fri", label: "Cum", full: "Cuma",       dow: 5 },
  { key: "sat", label: "Cmt", full: "Cumartesi",  dow: 6 },
  { key: "sun", label: "Paz", full: "Pazar",      dow: 0 },
];

function minToHM(m) {
  if (m == null) return null;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function todayDow() { return new Date().getDay(); } // 0=Sun

const inp = {
  width: "100%", padding: "8px 10px", borderRadius: "7px",
  border: `1px solid ${C.border}`, background: "var(--makas-surface)",
  color: C.primary, fontSize: "13px", boxSizing: "border-box",
};

// ── Manage button ─────────────────────────────────────────────────────────────
// Uses AdminTabContext — same mechanism as clicking the sidebar.

function ManageButton({ tab, stab, label = "Yönet" }) {
  const ctx = useAdminTab();
  const [hov, setHov] = useState(false);
  function navigate(e) {
    e.stopPropagation();
    if (!ctx) return;
    if (stab) ctx.setSettingsTab(stab);
    ctx.setTab(tab);
  }
  return (
    <button
      onClick={navigate}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "3px 10px 3px 8px", borderRadius: "6px",
        border: `1px solid ${hov ? C.primary : C.border}`,
        background: hov ? C.primary : "transparent",
        color: hov ? "var(--makas-bg)" : C.secondary,
        fontSize: "11px", fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      {label} <ArrowUpRight size={11} />
    </button>
  );
}

// ── Accordion ─────────────────────────────────────────────────────────────────
// Header is a <div role="button"> to avoid nested <button> hydration errors
// (ManageButton inside the header is itself a <button>).

function Accordion({ icon: Icon, emoji, title, count, tab, stab, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && setOpen(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", cursor: "pointer", userSelect: "none" }}
      >
        <span style={{ fontSize: "16px", flexShrink: 0 }}>{emoji}</span>
        {Icon && <Icon size={14} style={{ color: C.secondary, flexShrink: 0 }} />}
        <span style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>{title}</span>
        {typeof count === "number" && (
          <span style={{ fontSize: "11px", color: C.muted, background: C.surface, padding: "2px 8px", borderRadius: "999px", marginLeft: "2px" }}>
            {count}
          </span>
        )}
        {badge && (
          <span style={{ fontSize: "10px", background: "#FEF3C7", color: "#92400E", padding: "2px 7px", borderRadius: "999px" }}>{badge}</span>
        )}
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {tab && <ManageButton tab={tab} stab={stab} />}
          {open ? <ChevronDown size={14} color={C.muted} /> : <ChevronRight size={14} color={C.muted} />}
        </span>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "16px", background: "var(--makas-bg)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Context Summary card ──────────────────────────────────────────────────────

function ContextSummaryCard({ counts, estimatedTokens, warnings }) {
  const items = [
    { label: "Hizmet",       value: counts?.services  ?? 0 },
    { label: "Berber",       value: counts?.barbers   ?? 0 },
    { label: "Tatil",        value: counts?.holidays  ?? 0 },
    { label: "Ek Bilgi",     value: counts?.knowledge ?? 0 },
    { label: "AI Kuralı",    value: counts?.rules     ?? 0 },
  ];
  const allGood = warnings?.length === 0;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "16px 20px", boxShadow: SHADOW.card, marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>AI Bağlam Özeti</div>
          <div style={{ fontSize: "12px", color: C.secondary, marginTop: "2px" }}>Asistanın şu an kullandığı bilgiler</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "999px", background: allGood ? "#DCFCE7" : "#FEF9C3", color: allGood ? "#15803D" : "#92400E", fontSize: "12px", fontWeight: 600 }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: allGood ? "#15803D" : "#D97706" }} />
          {allGood ? "Hazır" : `${warnings.length} uyarı`}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "8px", marginBottom: "12px" }}>
        {items.map(it => (
          <div key={it.label} style={{ background: "var(--makas-bg)", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: C.primary, lineHeight: 1 }}>{it.value}</div>
            <div style={{ fontSize: "10px", color: C.muted, marginTop: "3px" }}>{it.label}</div>
          </div>
        ))}
        <div style={{ background: "var(--makas-bg)", borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: C.primary, lineHeight: 1 }}>≈{(estimatedTokens ?? 0).toLocaleString()}</div>
          <div style={{ fontSize: "10px", color: C.muted, marginTop: "3px" }}>Tahmini Token</div>
        </div>
      </div>
      <div style={{ fontSize: "11px", color: C.muted }}>
        Veriler 5 dakikada bir yenilenir. Anlık değişiklikler için sayfayı yenileyin.
      </div>
    </div>
  );
}

// ── Warnings panel ────────────────────────────────────────────────────────────

function WarningsPanel({ warnings }) {
  const [open, setOpen] = useState(true);
  const ctx = useAdminTab();
  if (!warnings?.length) return null;
  function fix(w) {
    if (!ctx || !w.tab) return;
    if (w.stab) ctx.setSettingsTab(w.stab);
    ctx.setTab(w.tab);
  }
  return (
    <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <AlertTriangle size={14} style={{ color: "#D97706", flexShrink: 0 }} />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#92400E" }}>Eksik Bilgiler ({warnings.length})</span>
        <span style={{ marginLeft: "auto" }}>{open ? <ChevronDown size={14} color="#D97706" /> : <ChevronRight size={14} color="#D97706" />}</span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid #FDE68A", padding: "8px 16px 12px" }}>
          {warnings.map(w => (
            <div key={w.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #FEF3C7" }}>
              <span style={{ fontSize: "12px", color: "#92400E" }}>⚠ {w.message}</span>
              {w.tab && (
                <button onClick={() => fix(w)} style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "6px", border: "1px solid #D97706", background: "transparent", color: "#D97706", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: "3px" }}>
                  Düzelt <ArrowUpRight size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Working hours grid ────────────────────────────────────────────────────────

function WorkingHoursGrid({ wh }) {
  if (!wh) return <p style={{ color: C.muted, fontSize: "12px", margin: 0 }}>Çalışma saati tanımlanmamış.</p>;
  const today = todayDow();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
      {DAYS.map(d => {
        const start = minToHM(wh[`${d.key}Start`]);
        const end   = minToHM(wh[`${d.key}End`]);
        const isToday = d.dow === today;
        const isClosed = !start || !end;
        return (
          <div key={d.key} style={{
            padding: "8px 4px", borderRadius: "8px", textAlign: "center",
            background: isToday ? (isClosed ? "#FEF2F2" : "#DCFCE7") : "var(--makas-surface)",
            border: `1px solid ${isToday ? (isClosed ? "#FECACA" : "#86EFAC") : C.border}`,
          }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: isToday ? (isClosed ? "#DC2626" : "#15803D") : C.muted, marginBottom: "4px" }}>{d.label}</div>
            {isClosed
              ? <div style={{ fontSize: "9px", color: isClosed && isToday ? "#DC2626" : C.muted }}>Kapalı</div>
              : <>
                  <div style={{ fontSize: "9px", color: isToday ? "#15803D" : C.primary, fontWeight: 600 }}>{start}</div>
                  <div style={{ fontSize: "9px", color: isToday ? "#15803D" : C.secondary }}>{end}</div>
                </>
            }
          </div>
        );
      })}
    </div>
  );
}

// ── Services section ──────────────────────────────────────────────────────────

function ServicesSection({ services }) {
  if (!services?.length) return <p style={{ color: C.muted, fontSize: "12px", margin: 0 }}>Henüz hizmet tanımlanmamış.</p>;
  const cats = [...new Set(services.map(s => s.category))];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {cats.map(cat => (
        <div key={cat}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "8px" }}>{cat}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {services.filter(s => s.category === cat).map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "var(--makas-surface)", borderRadius: "8px", border: `1px solid ${C.border}` }}>
                {s.popular && <Star size={12} style={{ color: "#D97706", flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>{s.nameTr}</div>
                  {s.descTr && <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>{s.descTr}</div>}
                </div>
                <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                  <span style={{ fontSize: "12px", color: C.secondary }}>{s.duration} dk</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: C.primary }}>{s.price != null ? `₺${s.price}` : "Sorulur"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <ManageButton tab="services-mgmt" label="Hizmetleri Düzenle" />
    </div>
  );
}

// ── Barbers section ───────────────────────────────────────────────────────────

function BarberCard({ b }) {
  const [open, setOpen] = useState(false);
  const recurringBreaks = (b.breaks ?? []).filter(br => br.dayOfWeek != null && !br.date);
  return (
    <div style={{ background: "var(--makas-surface)", border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--makas-bg)" }}>{b.nameTr.charAt(0)}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>{b.nameTr}</div>
          <div style={{ fontSize: "11px", color: C.muted }}>{b.titleTr}{b.yearsExp ? ` · ${b.yearsExp} yıl deneyim` : ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {b.rating > 0 && (
            <span style={{ fontSize: "11px", color: "#D97706", display: "flex", alignItems: "center", gap: "2px" }}>
              <Star size={10} fill="#D97706" /> {b.rating.toFixed(1)}
            </span>
          )}
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#15803D" }} />
          {open ? <ChevronDown size={13} color={C.muted} /> : <ChevronRight size={13} color={C.muted} />}
        </div>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Bio */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Biyografi</div>
            <p style={{ fontSize: "12px", color: C.secondary, lineHeight: 1.6, margin: 0 }}>
              {b.bioTr || <span style={{ color: C.muted, fontStyle: "italic" }}>Henüz biyografi girilmemiş.</span>}
            </p>
          </div>
          {/* Specialties */}
          {b.specialties?.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Uzmanlık</div>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {b.specialties.map(sp => (
                  <span key={sp} style={{ fontSize: "11px", color: C.primary, background: C.card, border: `1px solid ${C.border}`, padding: "2px 8px", borderRadius: "999px" }}>{sp}</span>
                ))}
              </div>
            </div>
          )}
          {/* Services */}
          {b.services?.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Hizmetler</div>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {b.services.map(bs => (
                  <span key={bs.service.id} style={{ fontSize: "11px", color: C.secondary, display: "flex", alignItems: "center", gap: "3px" }}>
                    <CheckCircle2 size={10} style={{ color: "#15803D" }} /> {bs.service.nameTr}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Working hours */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>Çalışma Saatleri</div>
            <WorkingHoursGrid wh={b.workingHours} />
          </div>
          {/* Breaks */}
          {recurringBreaks.length > 0 && (
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>Molalar</div>
              {recurringBreaks.map((br, i) => {
                const d = DAYS.find(day => day.dow === ((br.dayOfWeek + 6) % 7 + 1) % 7) ?? null;
                return (
                  <div key={i} style={{ fontSize: "12px", color: C.secondary }}>
                    {d ? d.full : "Her gün"}: {br.start}–{br.end} ({br.label})
                  </div>
                );
              })}
            </div>
          )}
          <ManageButton tab="barbers" label="Berberi Düzenle" />
        </div>
      )}
    </div>
  );
}

// ── Salon info section ────────────────────────────────────────────────────────

function SalonInfoSection({ shop }) {
  if (!shop) return <p style={{ color: C.muted, fontSize: "12px", margin: 0 }}>Salon bilgisi bulunamadı.</p>;
  const row = (icon, label, value) => value ? (
    <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: C.muted, flexShrink: 0, paddingTop: "1px" }}>{icon}</span>
      <span style={{ fontSize: "11px", color: C.muted, width: "110px", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "12px", color: C.primary }}>{value}</span>
    </div>
  ) : null;
  const amenities = [
    shop.wifi && "Wi-Fi",
    shop.parking && "Otopark",
    shop.airConditioning && "Klima",
    shop.disabledAccess && "Engelli Erişimi",
    shop.childFriendly && "Çocuk Dostu",
  ].filter(Boolean);
  return (
    <div>
      {row(<Building2 size={13} />, "Salon Adı", shop.name)}
      {row(<Phone size={13} />, "Telefon", shop.phone)}
      {row(<Phone size={13} />, "WhatsApp", shop.whatsappNumber)}
      {row(<MapPin size={13} />, "Adres", shop.address)}
      {row(<Link2 size={13} />, "Instagram", shop.instagramUrl)}
      {row(<Link2 size={13} />, "Facebook", shop.facebookUrl)}
      {row(<Globe size={13} />, "Website", shop.website)}
      {shop.about && (
        <div style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "11px", color: C.muted, marginBottom: "4px" }}>Hakkımızda</div>
          <p style={{ fontSize: "12px", color: C.secondary, lineHeight: 1.6, margin: 0 }}>{shop.about}</p>
        </div>
      )}
      {amenities.length > 0 && (
        <div style={{ padding: "10px 0" }}>
          <div style={{ fontSize: "11px", color: C.muted, marginBottom: "6px" }}>Olanaklar</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {amenities.map(a => (
              <span key={a} style={{ fontSize: "11px", color: C.primary, background: C.surface, border: `1px solid ${C.border}`, padding: "3px 10px", borderRadius: "999px" }}>{a}</span>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: "12px" }}>
        <ManageButton tab="settings" stab="profile" label="Salon Bilgilerini Düzenle" />
      </div>
    </div>
  );
}

// ── Holidays section ──────────────────────────────────────────────────────────

function HolidaysSection({ holidays }) {
  if (!holidays?.length) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: C.muted }}>
        <Calendar size={24} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
        <p style={{ fontSize: "12px", margin: 0 }}>Önümüzdeki 30 gün içinde tatil günü yok.</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {holidays.map((h, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "var(--makas-surface)", borderRadius: "8px", border: `1px solid ${C.border}` }}>
          <div style={{ padding: "6px 10px", background: "#FEF2F2", borderRadius: "6px", fontSize: "11px", fontWeight: 600, color: "#DC2626", flexShrink: 0 }}>
            {h.date}
          </div>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>{h.label}</div>
            <div style={{ fontSize: "11px", color: C.muted }}>{h.barber?.nameTr ? `${h.barber.nameTr} izinli` : "Tüm salon kapalı"}</div>
          </div>
        </div>
      ))}
      <ManageButton tab="settings" stab="holidays" label="Tatilleri Yönet" />
    </div>
  );
}

// ── Payment section ───────────────────────────────────────────────────────────

function PaymentSection({ shop }) {
  const methods = [
    { label: "Nakit", icon: "💵", active: true },
    { label: "Kredi/Banka Kartı", icon: "💳", active: !!shop?.creditCard },
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        {methods.map(m => (
          <div key={m.label} style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px",
            borderRadius: "8px", border: `1px solid ${m.active ? "#86EFAC" : C.border}`,
            background: m.active ? "#DCFCE7" : "var(--makas-surface)", opacity: m.active ? 1 : 0.4,
          }}>
            <span style={{ fontSize: "16px" }}>{m.icon}</span>
            <span style={{ fontSize: "12px", color: m.active ? "#15803D" : C.muted, fontWeight: 500 }}>{m.label}</span>
            {m.active && <CheckCircle2 size={12} style={{ color: "#15803D" }} />}
          </div>
        ))}
      </div>
      <ManageButton tab="settings" stab="profile" label="Ödeme Ayarları" />
    </div>
  );
}

// ── Custom KB entry form ──────────────────────────────────────────────────────

function EntryForm({ form, setForm, saving, onSave, onCancel }) {
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }} onClick={e => e.stopPropagation()}>
      <div style={{ display: "flex", gap: "8px" }}>
        <select value={form.category} onChange={e => f("category", e.target.value)} style={{ ...inp, flex: "0 0 auto" }}>
          {CUSTOM_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.secondary, whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={form.enabled} onChange={e => f("enabled", e.target.checked)} /> Aktif
        </label>
      </div>
      <input placeholder="Başlık" value={form.title} onChange={e => f("title", e.target.value)} style={inp} />
      <textarea placeholder="İçerik" value={form.content} onChange={e => f("content", e.target.value)} rows={4} style={{ ...inp, resize: "vertical", lineHeight: 1.5 }} />
      <input placeholder="Etiketler (virgülle ayır)" value={form.tags} onChange={e => f("tags", e.target.value)} style={inp} />
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "7px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, fontSize: "13px", cursor: "pointer" }}>
          <X size={13} /> İptal
        </button>
        <button onClick={onSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 14px", borderRadius: "7px", border: "none", background: C.primary, color: "var(--makas-bg)", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          <Save size={13} /> {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

function formatUsage(entry) {
  if (!entry.usageCount) return "Hiç kullanılmadı";
  if (!entry.lastUsedAt) return `${entry.usageCount} kez kullanıldı`;
  const days = Math.floor((Date.now() - new Date(entry.lastUsedAt).getTime()) / 86400_000);
  if (days === 0) return `${entry.usageCount} kez — bugün`;
  if (days === 1) return `${entry.usageCount} kez — dün`;
  if (days < 7)  return `${entry.usageCount} kez — ${days} gün önce`;
  return `${entry.usageCount} kez kullanıldı`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  // Dynamic context state
  const [ctx,     setCtx]     = useState(null);
  const [ctxLoad, setCtxLoad] = useState(true);
  const [ctxErr,  setCtxErr]  = useState(null);

  // Custom KB state
  const [entries, setEntries] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [kbLoad,  setKbLoad]  = useState(true);
  const [filter,  setFilter]  = useState("ALL");
  const [search,  setSearch]  = useState("");
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [kbErr,   setKbErr]   = useState(null);

  const LIMIT = 50;

  useEffect(() => {
    apiFetch("/api/admin/ai-context")
      .then(data => setCtx(data))
      .catch(e => setCtxErr(e.message))
      .finally(() => setCtxLoad(false));
  }, []);

  const loadKb = useCallback(async (p = 1, s = search, cat = filter) => {
    setKbLoad(true);
    try {
      const q = new URLSearchParams({ page: p, limit: LIMIT });
      if (cat && cat !== "ALL") q.set("category", cat);
      if (s) q.set("search", s);
      const data = await apiFetch(`/api/admin/knowledge?${q}`);
      setEntries(data.data ?? []);
      setTotal(data.total ?? 0);
      setPage(p);
    } catch (e) { setKbErr(e.message); }
    finally { setKbLoad(false); }
  }, [search, filter]);

  useEffect(() => { loadKb(1, search, filter); }, [filter]); // eslint-disable-line
  useEffect(() => { loadKb(1); }, [loadKb]);

  function openNew() { setForm(EMPTY_FORM); setEditing("new"); setKbErr(null); }
  function openEdit(e) { setForm({ category: CUSTOM_CATEGORIES.find(c => c.value === e.category) ? e.category : "FAQ", title: e.title, content: e.content, tags: e.tags.join(", "), enabled: e.enabled, sortOrder: e.sortOrder ?? 0 }); setEditing(e.id); setKbErr(null); }
  function cancelEdit() { setEditing(null); setKbErr(null); }

  async function save() {
    setSaving(true); setKbErr(null);
    const body = { ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), sortOrder: Number(form.sortOrder) };
    try {
      if (editing === "new") await apiFetch("/api/admin/knowledge", { method: "POST", body: JSON.stringify(body) });
      else await apiFetch(`/api/admin/knowledge/${editing}`, { method: "PATCH", body: JSON.stringify(body) });
      await loadKb(page);
      cancelEdit();
    } catch (e) { setKbErr(e.message); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    if (!confirm("Bu girişi silmek istediğinizden emin misiniz?")) return;
    try {
      await apiFetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      setEntries(prev => prev.filter(e => e.id !== id));
      setTotal(t => t - 1);
    } catch (e) { setKbErr(e.message); }
  }

  async function toggleEnabled(entry) {
    try {
      const updated = await apiFetch(`/api/admin/knowledge/${entry.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !entry.enabled }) });
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ...updated } : e));
    } catch (e) { setKbErr(e.message); }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const raw = ctx?.raw ?? {};

  return (
    <div style={{ maxWidth: "900px" }}>
      <AdminPageHeader
        title="AI Bağlam Yöneticisi"
        sub="Asistanın şu an bildiği her şey — veritabanından gerçek zamanlı"
        actions={
          <button onClick={() => { setCtxLoad(true); apiFetch("/api/admin/ai-context").then(setCtx).catch(e => setCtxErr(e.message)).finally(() => setCtxLoad(false)); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, fontSize: "13px", cursor: "pointer" }}
          >
            <RefreshCw size={13} /> Yenile
          </button>
        }
      />

      {/* Summary */}
      {ctxLoad
        ? <DSSkeleton className="h-20 rounded-[12px] mb-5" />
        : <ContextSummaryCard counts={ctx?.counts} estimatedTokens={ctx?.estimatedTokens} warnings={ctx?.warnings} />
      }

      {/* Warnings */}
      {!ctxLoad && ctx?.warnings?.length > 0 && (
        <WarningsPanel warnings={ctx.warnings} />
      )}

      {/* ── Automatic context ── */}
      <div style={{ marginBottom: "28px" }}>
        <SectionLabel>Otomatik Bağlam</SectionLabel>
        <p style={{ fontSize: "12px", color: C.muted, marginBottom: "12px", marginTop: 0 }}>
          AI bu bilgileri sisteminizden otomatik olarak alır. Değiştirmek için ilgili yönetim sayfasına gidin.
        </p>
        {ctxErr && <ErrorBox>{ctxErr}</ErrorBox>}
        {ctxLoad
          ? <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{[1,2,3,4].map(i => <DSSkeleton key={i} className="h-12 rounded-[10px]" />)}</div>
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Accordion emoji="💈" title="Hizmetler" count={raw.services?.length ?? 0} tab="services-mgmt">
                <ServicesSection services={raw.services} />
              </Accordion>

              <Accordion emoji="👤" title="Berberler" count={raw.barbers?.length ?? 0} tab="barbers" badge={raw.barbers?.some(b => !b.bioTr) ? "Eksik biyografi" : null}>
                {raw.barbers?.length
                  ? <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {raw.barbers.map(b => <BarberCard key={b.id} b={b} />)}
                    </div>
                  : <p style={{ color: C.muted, fontSize: "12px", margin: 0 }}>Henüz berber tanımlanmamış.</p>
                }
              </Accordion>

              <Accordion emoji="🕒" title="Çalışma Saatleri" tab="settings" stab="hours">
                {raw.barbers?.length
                  ? <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {raw.barbers.map(b => (
                        <div key={b.id}>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary, marginBottom: "8px" }}>{b.nameTr}</div>
                          <WorkingHoursGrid wh={b.workingHours} />
                        </div>
                      ))}
                    </div>
                  : <p style={{ color: C.muted, fontSize: "12px", margin: 0 }}>Çalışma saati tanımlanmamış.</p>
                }
              </Accordion>

              <Accordion emoji="🏠" title="Salon Bilgisi" tab="settings" stab="profile">
                <SalonInfoSection shop={raw.shop} />
              </Accordion>

              <Accordion emoji="💳" title="Ödeme Yöntemleri" tab="settings" stab="profile">
                <PaymentSection shop={raw.shop} />
              </Accordion>

              <Accordion emoji="📅" title="Yaklaşan Tatiller" count={raw.holidays?.length ?? 0} tab="settings" stab="holidays">
                <HolidaysSection holidays={raw.holidays} />
              </Accordion>
            </div>
          )
        }
      </div>

      {/* ── Custom knowledge ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <SectionLabel style={{ marginBottom: 0 }}>Ek AI Bilgisi {total > 0 && <span style={{ color: C.muted, fontWeight: 400, fontSize: "12px" }}>— {total} giriş</span>}</SectionLabel>
          <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", background: C.primary, color: "var(--makas-bg)", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
            <Plus size={14} /> Ekle
          </button>
        </div>
        <p style={{ fontSize: "12px", color: C.muted, marginBottom: "12px", marginTop: 0 }}>
          Sistemde kayıtlı olmayan ek bilgiler. AI bu bilgileri otomatik bağlamla birleştirerek kullanır.
        </p>

        {/* Filter + search */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
          {[{ value: "ALL", label: "Tümü" }, ...CUSTOM_CATEGORIES].map(cat => (
            <button key={cat.value} onClick={() => { setFilter(cat.value); loadKb(1, search, cat.value); }} style={{ padding: "5px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, border: `1px solid ${filter === cat.value ? C.primary : C.border}`, background: filter === cat.value ? C.primary : "transparent", color: filter === cat.value ? "var(--makas-bg)" : C.secondary, cursor: "pointer" }}>
              {cat.label}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", marginBottom: "14px", maxWidth: "360px" }}>
          <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
          <input value={search} onChange={e => { setSearch(e.target.value); loadKb(1, e.target.value, filter); }} placeholder="Başlık veya içerikte ara…" style={{ ...inp, paddingLeft: "30px" }} />
        </div>

        {kbErr && <ErrorBox>{kbErr}</ErrorBox>}

        {editing === "new" && (
          <div style={{ background: C.card, border: `1px solid ${C.primary}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: C.muted, marginBottom: "10px", letterSpacing: "0.06em" }}>YENİ GİRİŞ</div>
            <EntryForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={cancelEdit} />
          </div>
        )}

        {kbLoad
          ? <div style={{ color: C.muted, fontSize: "13px", padding: "20px 0" }}>Yükleniyor…</div>
          : entries.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
                <BookOpen size={28} style={{ marginBottom: "10px", opacity: 0.3 }} />
                <div style={{ fontSize: "13px" }}>{search ? "Arama sonucu bulunamadı." : "Henüz ek bilgi yok."}</div>
              </div>
            : <>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {entries.map(entry => (
                    <div key={entry.id} onClick={() => editing !== entry.id && openEdit(entry)} style={{ background: C.card, border: `1px solid ${editing === entry.id ? C.primary : C.border}`, borderRadius: "10px", padding: "14px 16px", opacity: entry.enabled || editing === entry.id ? 1 : 0.6, cursor: editing === entry.id ? "default" : "pointer", transition: "border-color 0.15s" }}>
                      {editing === entry.id ? (
                        <>
                          <div style={{ fontSize: "11px", fontWeight: 600, color: C.muted, marginBottom: "10px" }}>DÜZENLE</div>
                          <EntryForm form={form} setForm={setForm} saving={saving} onSave={save} onCancel={cancelEdit} />
                        </>
                      ) : (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "10px", fontWeight: 600, color: C.muted, background: C.surface, padding: "2px 7px", borderRadius: "999px" }}>
                                {CATEGORY_LABEL[entry.category] ?? entry.category}
                              </span>
                              {!entry.enabled && <span style={{ fontSize: "10px", color: "#92400E", background: "#FEF3C7", padding: "2px 7px", borderRadius: "999px" }}>Devre dışı</span>}
                              <span style={{ fontSize: "10px", color: C.muted }}>{formatUsage(entry)}</span>
                              <span style={{ fontSize: "10px", color: C.muted }}>{entry.content.length} karakter</span>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: "13px", color: C.primary, marginBottom: "4px" }}>{entry.title}</div>
                            <div style={{ fontSize: "12px", color: C.secondary, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{entry.content}</div>
                            {entry.tags?.length > 0 && (
                              <div style={{ marginTop: "6px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {entry.tags.map(t => <span key={t} style={{ fontSize: "10px", color: C.muted, background: C.surface, padding: "1px 6px", borderRadius: "4px" }}>#{t}</span>)}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => toggleEnabled(entry)} title={entry.enabled ? "Devre dışı bırak" : "Etkinleştir"} style={{ padding: "6px", border: "none", background: "transparent", cursor: "pointer", color: entry.enabled ? "#15803D" : C.muted, borderRadius: "6px" }}>
                              {entry.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button onClick={() => remove(entry.id)} style={{ padding: "6px", border: "none", background: "transparent", cursor: "pointer", color: "#DC2626", borderRadius: "6px" }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px", alignItems: "center" }}>
                    <button onClick={() => loadKb(page - 1)} disabled={page <= 1} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1, fontSize: "12px" }}>‹ Önceki</button>
                    <span style={{ fontSize: "12px", color: C.muted }}>Sayfa {page} / {totalPages}</span>
                    <button onClick={() => loadKb(page + 1)} disabled={page >= totalPages} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1, fontSize: "12px" }}>Sonraki ›</button>
                  </div>
                )}
              </>
        }
      </div>
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "10px", ...style }}>
      {children}
    </div>
  );
}

function ErrorBox({ children }) {
  return (
    <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px", marginBottom: "14px" }}>
      {children}
    </div>
  );
}
