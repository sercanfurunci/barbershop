"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  MessageSquare, Smartphone, Bell, Clock, CheckCircle2, XCircle,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, RefreshCw, Save,
} from "lucide-react";

import { C, SHADOW } from "@/lib/adminTheme";

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  PENDING:    { bg: "#FEF3C7", color: "#92400E", label: "Bekliyor" },
  PROCESSING: { bg: "#DBEAFE", color: "#1E40AF", label: "İşleniyor" },
  SENT:       { bg: "#D1FAE5", color: "#065F46", label: "Gönderildi" },
  FAILED:     { bg: "#FEE2E2", color: "#991B1B", label: "Başarısız" },
  CANCELLED:  { bg: "#F3F4F6", color: "#6B7280", label: "İptal" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "100px", letterSpacing: "0.02em" }}>
      {s.label}
    </span>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        width: "40px", height: "22px", borderRadius: "100px", border: "none",
        background: checked ? C.primary : C.dim,
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: "3px", left: checked ? "21px" : "3px",
        width: "16px", height: "16px", borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, type = "text", maxLength, placeholder, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "11px", fontWeight: 600, color: C.secondary, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        style={{
          height: "36px", padding: "0 10px", borderRadius: "8px",
          border: `1px solid ${C.border}`, background: C.card,
          fontSize: "13px", color: C.primary, outline: "none",
          fontFamily: "inherit",
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(17,17,17,0.35)")}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
      {hint && <span style={{ fontSize: "10px", color: C.muted }}>{hint}</span>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
function Textarea({ label, value, onChange, placeholder, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "11px", fontWeight: 600, color: C.secondary, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </label>
      <textarea
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          padding: "8px 10px", borderRadius: "8px",
          border: `1px solid ${C.border}`, background: C.card,
          fontSize: "12px", color: C.primary, outline: "none",
          fontFamily: "inherit", resize: "vertical", lineHeight: 1.5,
        }}
        onFocus={e => (e.target.style.borderColor = "rgba(17,17,17,0.35)")}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
      {hint && <span style={{ fontSize: "10px", color: C.muted }}>{hint}</span>}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {title && <div style={{ fontSize: "13px", fontWeight: 700, color: C.primary, letterSpacing: "0.01em" }}>{title}</div>}
      {children}
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────
function ToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
      <div>
        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>{label}</div>
        {description && <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{description}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

const PLACEHOLDER_HINT = "Değişkenler: {{name}}, {{service}}, {{barber}}, {{date}}, {{time}}, {{shop}}";

const TEMPLATE_FIELDS = [
  { key: "tplCreated",      label: "Randevu Oluşturuldu" },
  { key: "tplConfirmed",    label: "Randevu Onaylandı" },
  { key: "tplCancelled",    label: "Randevu İptal Edildi" },
  { key: "tplReminder48h",  label: "48 Saat Hatırlatma" },
  { key: "tplReminder3h",   label: "3 Saat Hatırlatma" },
  { key: "tplFollowup",     label: "Randevu Sonrası Geri Bildirim" },
];

// ─── Settings tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/notification-settings")
      .then(data => setForm({
        smsEnabled:      false,
        waEnabled:       false,
        netgsmUser:      "",
        netgsmPassword:  "",
        netgsmHeader:    "",
        reminder48h:     true,
        reminder3h:      true,
        followupEnabled: false,
        followupHours:   24,
        tplCreated:      "",
        tplConfirmed:    "",
        tplCancelled:    "",
        tplReminder48h:  "",
        tplReminder3h:   "",
        tplFollowup:     "",
        ...data,
      }))
      .catch(() => setError("Ayarlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await apiFetch("/api/admin/notification-settings", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setForm(f => ({ ...f, ...updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message ?? "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px", gap: "8px", color: C.muted }}>
        <Loader2 size={18} className="animate-spin" />
        <span style={{ fontSize: "13px" }}>Yükleniyor…</span>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Channels */}
      <SectionCard title="Kanal Ayarları">
        <ToggleRow
          label="SMS Aktif"
          description="Netgsm üzerinden SMS bildirimleri gönder"
          checked={form.smsEnabled}
          onChange={v => set("smsEnabled", v)}
        />
        <ToggleRow
          label="WhatsApp Aktif"
          description="Netgsm üzerinden WhatsApp mesajları gönder"
          checked={form.waEnabled}
          onChange={v => set("waEnabled", v)}
        />
      </SectionCard>

      {/* Credentials */}
      <SectionCard title="Netgsm Kimlik Bilgileri">
        <Input
          label="Kullanıcı Adı"
          value={form.netgsmUser}
          onChange={v => set("netgsmUser", v)}
          placeholder="Netgsm kullanıcı adı"
        />
        <Input
          label="Şifre"
          type="password"
          value={form.netgsmPassword}
          onChange={v => set("netgsmPassword", v)}
          placeholder="Netgsm şifresi"
        />
        <Input
          label="SMS Başlığı"
          value={form.netgsmHeader}
          onChange={v => set("netgsmHeader", v)}
          maxLength={11}
          placeholder="Max 11 karakter"
          hint="SMS gönderici adı. Maksimum 11 karakter."
        />
      </SectionCard>

      {/* Reminders */}
      <SectionCard title="Hatırlatma Ayarları">
        <ToggleRow
          label="48 Saat Hatırlatma"
          description="Randevudan 48 saat önce müşteriye hatırlatma gönder"
          checked={form.reminder48h}
          onChange={v => set("reminder48h", v)}
        />
        <ToggleRow
          label="3 Saat Hatırlatma"
          description="Randevudan 3 saat önce müşteriye hatırlatma gönder"
          checked={form.reminder3h}
          onChange={v => set("reminder3h", v)}
        />
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <ToggleRow
            label="Randevu Sonrası Geri Bildirim"
            description="Randevudan belirli saat sonra geri bildirim mesajı gönder"
            checked={form.followupEnabled}
            onChange={v => set("followupEnabled", v)}
          />
          {form.followupEnabled && (
            <Input
              label="Geri Bildirim Gecikmesi (Saat)"
              type="number"
              value={form.followupHours}
              onChange={v => set("followupHours", parseInt(v) || 24)}
              placeholder="24"
              hint="Randevudan kaç saat sonra geri bildirim gönderilsin?"
            />
          )}
        </div>
      </SectionCard>

      {/* Templates */}
      <SectionCard title="Mesaj Şablonları">
        <p style={{ fontSize: "12px", color: C.muted, margin: 0 }}>
          Boş bırakılan şablonlar için varsayılan Türkçe mesajlar kullanılır.
        </p>
        {TEMPLATE_FIELDS.map(({ key, label }) => (
          <Textarea
            key={key}
            label={label}
            value={form[key]}
            onChange={v => set(key, v)}
            placeholder="Boş bırakın — varsayılan şablon kullanılır"
            hint={PLACEHOLDER_HINT}
          />
        ))}
      </SectionCard>

      {/* Error / success */}
      {error && (
        <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#991B1B", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}
      {saved && (
        <div style={{ background: "#D1FAE5", border: "1px solid #A7F3D0", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#065F46", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={14} />
          Ayarlar kaydedildi.
        </div>
      )}

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            height: "38px", padding: "0 20px", borderRadius: "8px",
            background: saving ? C.dim : C.primary,
            border: "none", color: "#fff", fontSize: "13px", fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
            transition: "background 0.15s",
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────
const EVENT_LABELS = {
  CREATED:      "Oluşturuldu",
  CONFIRMED:    "Onaylandı",
  CANCELLED:    "İptal",
  REMINDER_48H: "48s Hatırlatma",
  REMINDER_3H:  "3s Hatırlatma",
  FOLLOWUP:     "Geri Bildirim",
};

function HistoryTab() {
  const [data, setData]         = useState({ jobs: [], total: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [channelFilter, setChannelFilter] = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [page, setPage]         = useState(0);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit:  String(LIMIT),
        offset: String(page * LIMIT),
        ...(channelFilter && { channel: channelFilter }),
        ...(statusFilter  && { status:  statusFilter  }),
      });
      const res = await apiFetch(`/api/admin/notification-history?${params}`);
      setData(res);
    } catch (e) {
      setError(e.message ?? "Geçmiş yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [page, channelFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [channelFilter, statusFilter]);

  const totalPages = Math.ceil(data.total / LIMIT);

  const filterBtn = (label, value, current, onChange) => (
    <button
      key={value}
      onClick={() => onChange(current === value ? "" : value)}
      style={{
        height: "30px", padding: "0 12px", borderRadius: "6px",
        border: `1px solid ${current === value ? C.primary : C.border}`,
        background: current === value ? C.primary : C.card,
        color: current === value ? "#fff" : C.secondary,
        fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Filter bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Kanal:</span>
        {filterBtn("Tümü", "",          channelFilter, setChannelFilter)}
        {filterBtn("SMS",  "SMS",       channelFilter, setChannelFilter)}
        {filterBtn("WhatsApp", "WHATSAPP", channelFilter, setChannelFilter)}

        <div style={{ width: "1px", height: "20px", background: C.border, margin: "0 4px" }} />

        <span style={{ fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Durum:</span>
        {filterBtn("Tümü",        "",           statusFilter, setStatusFilter)}
        {filterBtn("Bekliyor",    "PENDING",    statusFilter, setStatusFilter)}
        {filterBtn("Gönderildi",  "SENT",       statusFilter, setStatusFilter)}
        {filterBtn("Başarısız",   "FAILED",     statusFilter, setStatusFilter)}

        <button
          onClick={load}
          style={{ marginLeft: "auto", height: "30px", width: "30px", borderRadius: "6px", border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}
          title="Yenile"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#991B1B" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px", gap: "8px", color: C.muted }}>
            <Loader2 size={18} className="animate-spin" />
            <span style={{ fontSize: "13px" }}>Yükleniyor…</span>
          </div>
        ) : data.jobs.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "160px", gap: "6px", color: C.muted }}>
            <Bell size={24} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: "13px" }}>Bildirim bulunamadı.</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Kanal", "Olay", "Telefon", "Mesaj", "Durum", "Planlandı", "Deneme"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((job, i) => (
                  <tr
                    key={job.id}
                    style={{ borderBottom: i < data.jobs.length - 1 ? `1px solid ${C.border}` : "none" }}
                  >
                    {/* Channel */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: job.channel === "SMS" ? "#1D4ED8" : "#16A34A" }}>
                        {job.channel === "SMS"
                          ? <Smartphone size={13} />
                          : <MessageSquare size={13} />}
                        <span style={{ fontSize: "11px", fontWeight: 600 }}>{job.channel}</span>
                      </div>
                    </td>
                    {/* Event */}
                    <td style={{ padding: "10px 14px", color: C.secondary, whiteSpace: "nowrap" }}>
                      {EVENT_LABELS[job.event] ?? job.event}
                    </td>
                    {/* Phone */}
                    <td style={{ padding: "10px 14px", color: C.primary, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                      {job.phone}
                    </td>
                    {/* Message preview */}
                    <td style={{ padding: "10px 14px", color: C.secondary, maxWidth: "260px" }}>
                      <span
                        title={job.message}
                        style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {job.message}
                      </span>
                    </td>
                    {/* Status */}
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <StatusBadge status={job.status} />
                    </td>
                    {/* Scheduled */}
                    <td style={{ padding: "10px 14px", color: C.muted, whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Clock size={11} />
                        {new Date(job.scheduledFor).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </td>
                    {/* Attempts */}
                    <td style={{ padding: "10px 14px", color: C.muted, textAlign: "center" }}>
                      {job.attempts}/{job.maxAttempts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: C.muted }}>
            Toplam {data.total} kayıt — Sayfa {page + 1} / {totalPages}
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              style={{ height: "30px", width: "30px", borderRadius: "6px", border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: page === 0 ? "not-allowed" : "pointer", color: page === 0 ? C.dim : C.secondary }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              style={{ height: "30px", width: "30px", borderRadius: "6px", border: `1px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", color: page >= totalPages - 1 ? C.dim : C.secondary }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("settings");

  const tabs = [
    { id: "settings", label: "Ayarlar" },
    { id: "history",  label: "Geçmiş"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: C.primary, margin: 0 }}>Bildirimler</h1>
        <p style={{ fontSize: "13px", color: C.muted, margin: "4px 0 0" }}>
          SMS ve WhatsApp bildirim ayarları ile geçmiş log
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${C.border}`, paddingBottom: "1px" }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              height: "34px", padding: "0 16px", border: "none", background: "none",
              fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              color: activeTab === t.id ? C.primary : C.muted,
              borderBottom: activeTab === t.id ? `2px solid ${C.primary}` : "2px solid transparent",
              marginBottom: "-1px",
              transition: "color 0.15s, border-color 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "settings" && <SettingsTab />}
      {activeTab === "history"  && <HistoryTab  />}
    </div>
  );
}
