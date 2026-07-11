"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  MessageSquare, Smartphone, Bell, Clock, CheckCircle2,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, RefreshCw, Save,
} from "lucide-react";

import { AdminPageHeader, DSCard, DSPageLoader, DSChip } from "@/components/ds";

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
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-[0.02em]" style={{ background: s.bg, color: s.color }}>
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
      className="relative shrink-0 w-10 h-[22px] rounded-full border-0 transition-colors disabled:cursor-not-allowed"
      style={{ background: checked ? "var(--makas-ink)" : "#D8D1C7" }}
    >
      <span
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-[left] duration-200"
        style={{ left: checked ? "21px" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
      />
    </button>
  );
}

// ─── Field wrappers ───────────────────────────────────────────────────────────
function NField({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold text-secondary-foreground uppercase tracking-[0.04em]">{label}</label>
      {children}
      {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function NInput({ label, value, onChange, type = "text", maxLength, placeholder, hint }) {
  return (
    <NField label={label} hint={hint}>
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        className="h-9 px-2.5 rounded-[8px] border border-border bg-card text-[13px] text-foreground outline-none focus:border-foreground/30 transition-colors"
      />
    </NField>
  );
}

function NTextarea({ label, value, onChange, placeholder, hint }) {
  return (
    <NField label={label} hint={hint}>
      <textarea
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="px-2.5 py-2 rounded-[8px] border border-border bg-card text-[12px] text-foreground outline-none resize-y leading-relaxed focus:border-foreground/30 transition-colors"
      />
    </NField>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children }) {
  return (
    <DSCard className="p-5 flex flex-col gap-4">
      {title && <p className="text-[13px] font-semibold text-foreground">{title}</p>}
      {children}
    </DSCard>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[13px] text-foreground font-medium">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
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
        smsEnabled: false, waEnabled: false,
        netgsmUser: "", netgsmPassword: "", netgsmHeader: "",
        reminder48h: true, reminder3h: true,
        followupEnabled: false, followupHours: 24,
        tplCreated: "", tplConfirmed: "", tplCancelled: "",
        tplReminder48h: "", tplReminder3h: "", tplFollowup: "",
        ...data,
      }))
      .catch(() => setError("Ayarlar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true); setSaved(false); setError(null);
    try {
      const updated = await apiFetch("/api/admin/notification-settings", { method: "PATCH", body: JSON.stringify(form) });
      setForm(f => ({ ...f, ...updated }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message ?? "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DSPageLoader />;
  if (!form) return null;

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Kanal Ayarları">
        <ToggleRow label="SMS Aktif" description="Netgsm üzerinden SMS bildirimleri gönder" checked={form.smsEnabled} onChange={v => set("smsEnabled", v)} />
        <ToggleRow label="WhatsApp Aktif" description="Netgsm üzerinden WhatsApp mesajları gönder" checked={form.waEnabled} onChange={v => set("waEnabled", v)} />
      </SectionCard>

      <SectionCard title="Netgsm Kimlik Bilgileri">
        <NInput label="Kullanıcı Adı" value={form.netgsmUser} onChange={v => set("netgsmUser", v)} placeholder="Netgsm kullanıcı adı" />
        <NInput label="Şifre" type="password" value={form.netgsmPassword} onChange={v => set("netgsmPassword", v)} placeholder="Netgsm şifresi" />
        <NInput label="SMS Başlığı" value={form.netgsmHeader} onChange={v => set("netgsmHeader", v)} maxLength={11} placeholder="Max 11 karakter" hint="SMS gönderici adı. Maksimum 11 karakter." />
      </SectionCard>

      <SectionCard title="Hatırlatma Ayarları">
        <ToggleRow label="48 Saat Hatırlatma" description="Randevudan 48 saat önce müşteriye hatırlatma gönder" checked={form.reminder48h} onChange={v => set("reminder48h", v)} />
        <ToggleRow label="3 Saat Hatırlatma" description="Randevudan 3 saat önce müşteriye hatırlatma gönder" checked={form.reminder3h} onChange={v => set("reminder3h", v)} />
        <div className="border-t border-border pt-3.5 flex flex-col gap-3">
          <ToggleRow label="Randevu Sonrası Geri Bildirim" description="Randevudan belirli saat sonra geri bildirim mesajı gönder" checked={form.followupEnabled} onChange={v => set("followupEnabled", v)} />
          {form.followupEnabled && (
            <NInput label="Geri Bildirim Gecikmesi (Saat)" type="number" value={form.followupHours} onChange={v => set("followupHours", parseInt(v) || 24)} placeholder="24" hint="Randevudan kaç saat sonra geri bildirim gönderilsin?" />
          )}
        </div>
      </SectionCard>

      <SectionCard title="Mesaj Şablonları">
        <p className="text-[12px] text-muted-foreground">Boş bırakılan şablonlar için varsayılan Türkçe mesajlar kullanılır.</p>
        {TEMPLATE_FIELDS.map(({ key, label }) => (
          <NTextarea key={key} label={label} value={form[key]} onChange={v => set(key, v)} placeholder="Boş bırakın — varsayılan şablon kullanılır" hint={PLACEHOLDER_HINT} />
        ))}
      </SectionCard>

      {error && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[8px] text-[13px] text-destructive bg-destructive/8 border border-destructive/20">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[8px] text-[13px]" style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" }}>
          <CheckCircle2 size={14} /> Ayarlar kaydedildi.
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-9 px-5 rounded-[8px] bg-foreground text-background text-[13px] font-semibold disabled:opacity-50 transition-opacity"
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
  CREATED: "Oluşturuldu", CONFIRMED: "Onaylandı", CANCELLED: "İptal",
  REMINDER_48H: "48s Hatırlatma", REMINDER_3H: "3s Hatırlatma", FOLLOWUP: "Geri Bildirim",
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
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT), offset: String(page * LIMIT),
        ...(channelFilter && { channel: channelFilter }),
        ...(statusFilter  && { status:  statusFilter  }),
      });
      setData(await apiFetch(`/api/admin/notification-history?${params}`));
    } catch (e) {
      setError(e.message ?? "Geçmiş yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [page, channelFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(0); }, [channelFilter, statusFilter]);

  const totalPages = Math.ceil(data.total / LIMIT);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Kanal:</span>
        {[["Tümü",""],["SMS","SMS"],["WhatsApp","WHATSAPP"]].map(([label, val]) => (
          <DSChip key={val} active={channelFilter === val} onClick={() => setChannelFilter(channelFilter === val ? "" : val)}>{label}</DSChip>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.05em]">Durum:</span>
        {[["Tümü",""],["Bekliyor","PENDING"],["Gönderildi","SENT"],["Başarısız","FAILED"]].map(([label, val]) => (
          <DSChip key={val} active={statusFilter === val} onClick={() => setStatusFilter(statusFilter === val ? "" : val)}>{label}</DSChip>
        ))}
        <button onClick={load} className="ml-auto w-8 h-7 flex items-center justify-center rounded-[6px] border border-border bg-card text-muted-foreground hover:text-foreground transition-colors" title="Yenile">
          <RefreshCw size={13} />
        </button>
      </div>

      {error && (
        <div className="px-3.5 py-2.5 rounded-[8px] text-[13px] text-destructive bg-destructive/8 border border-destructive/20">{error}</div>
      )}

      {/* Table */}
      <DSCard className="overflow-hidden">
        {loading ? (
          <DSPageLoader />
        ) : data.jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-1.5 text-muted-foreground">
            <Bell size={24} className="opacity-30" />
            <span className="text-[13px]">Bildirim bulunamadı.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-border">
                  {["Kanal","Olay","Telefon","Mesaj","Durum","Planlandı","Deneme"].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.05em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.jobs.map((job, i) => (
                  <tr key={job.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5" style={{ color: job.channel === "SMS" ? "#1D4ED8" : "#16A34A" }}>
                        {job.channel === "SMS" ? <Smartphone size={13} /> : <MessageSquare size={13} />}
                        <span className="text-[11px] font-semibold">{job.channel}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-secondary-foreground whitespace-nowrap">{EVENT_LABELS[job.event] ?? job.event}</td>
                    <td className="px-3.5 py-2.5 text-foreground font-mono-custom whitespace-nowrap">{job.phone}</td>
                    <td className="px-3.5 py-2.5 text-secondary-foreground max-w-[260px]">
                      <span className="block truncate" title={job.message}>{job.message}</span>
                    </td>
                    <td className="px-3.5 py-2.5 whitespace-nowrap"><StatusBadge status={job.status} /></td>
                    <td className="px-3.5 py-2.5 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(job.scheduledFor).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-muted-foreground text-center">{job.attempts}/{job.maxAttempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DSCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] text-muted-foreground">Toplam {data.total} kayıt — Sayfa {page + 1} / {totalPages}</span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-8 h-7 flex items-center justify-center rounded-[6px] border border-border bg-card text-muted-foreground disabled:opacity-40 hover:bg-secondary transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="w-8 h-7 flex items-center justify-center rounded-[6px] border border-border bg-card text-muted-foreground disabled:opacity-40 hover:bg-secondary transition-colors">
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

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader title="Bildirimler" sub="SMS ve WhatsApp bildirim ayarları ile geçmiş log" />

      {/* Underline tab bar */}
      <div className="flex gap-1 border-b border-border">
        {[{ id: "settings", label: "Ayarlar" }, { id: "history", label: "Geçmiş" }].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="h-9 px-4 text-[13px] font-semibold transition-colors"
            style={{
              color: activeTab === t.id ? "var(--makas-ink)" : "var(--makas-ink-muted)",
              borderBottom: activeTab === t.id ? "2px solid var(--makas-ink)" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "settings" && <SettingsTab />}
      {activeTab === "history"  && <HistoryTab  />}
    </div>
  );
}
