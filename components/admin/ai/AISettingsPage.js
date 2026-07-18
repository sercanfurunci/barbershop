"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Plus, Trash2, Eye, CheckCircle2, AlertTriangle, RotateCcw, History } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { C, SHADOW } from "@/lib/adminTheme";
import { AdminPageHeader, DSTabBar } from "@/components/ds";
import PromptPreviewModal from "./PromptPreviewModal";

const TABS = [
  { id: "personality", label: "Kişilik" },
  { id: "rules",       label: "Kurallar" },
  { id: "prompt",      label: "Gelişmiş" },
  { id: "history",     label: "Geçmiş"   },
];

export default function AISettingsPage() {
  const [tab, setTab] = useState("personality");
  return (
    <div>
      <AdminPageHeader title="AI Ayarları" sub="Asistanın kişiliği, kuralları ve sistem komutu" />
      <ReadinessPanel />
      <DSTabBar tabs={TABS} active={tab} onChange={setTab} />
      {tab === "personality" && <PersonalityTab />}
      {tab === "rules"       && <RulesTab />}
      {tab === "prompt"      && <AdvancedTab />}
      {tab === "history"     && <HistoryTab />}
    </div>
  );
}

// ── Readiness Panel ───────────────────────────────────────────────────────────

function ReadinessPanel() {
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    apiFetch("/api/admin/ai-readiness").then(setData).catch(e => setError(e.message));
  }, []);

  if (error || !data) return null;

  const score = data.score ?? 0;
  const color = score >= 80 ? C.green : score >= 50 ? C.yellow : "#DC2626";
  const label = score >= 80 ? "Hazır" : score >= 50 ? "Kısmen Hazır" : "Eksik";
  const failing = (data.checks ?? []).filter(c => !c.passed);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 16px", boxShadow: SHADOW.card, marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: `conic-gradient(${color} ${score * 3.6}deg, ${C.border} 0)`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color }}>
            {score}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: C.primary }}>Hazırlık Skoru: {label}</div>
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>
            {failing.length === 0 ? "Tüm kontroller başarılı." : `${failing.length} eksik kontrol var.`}
          </div>
        </div>
        {failing.length > 0 && (
          <button
            onClick={() => setOpen(o => !o)}
            style={{ padding: "6px 12px", borderRadius: "7px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, fontSize: "12px", cursor: "pointer" }}
          >
            {open ? "Gizle" : "Detay"}
          </button>
        )}
      </div>
      {open && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.checks.map(c => (
            <div key={c.key} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "12px" }}>
              {c.passed
                ? <CheckCircle2 size={13} color={C.green} style={{ flexShrink: 0, marginTop: "2px" }} />
                : <AlertTriangle size={13} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />}
              <div style={{ flex: 1 }}>
                <div style={{ color: C.primary }}>{c.label} <span style={{ color: C.muted, fontSize: "10px" }}>({c.points}/{c.max})</span></div>
                {!c.passed && c.tip && <div style={{ color: C.muted, fontSize: "11px", marginTop: "2px" }}>{c.tip}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [snapshot, setSnapshot] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await apiFetch("/api/admin/ai-history")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function view(row) {
    setSelected(row.id);
    setSnapshot(null);
    try {
      const d = await apiFetch(`/api/admin/ai-history/${row.id}`);
      setSnapshot(d);
    } catch (e) { setError(e.message); }
  }

  async function restore(id) {
    if (!confirm("Bu sürüme geri dönmek istediğinizden emin misiniz? Mevcut sistem komutu üzerine yazılacak.")) return;
    try {
      await apiFetch("/api/admin/ai-history/restore", { method: "POST", body: JSON.stringify({ id }) });
      alert("Sürüm geri yüklendi.");
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm("Bu sürümü silmek istediğinizden emin misiniz?")) return;
    try {
      await apiFetch(`/api/admin/ai-history/${id}`, { method: "DELETE" });
      setRows(prev => prev.filter(r => r.id !== id));
      if (selected === id) { setSelected(null); setSnapshot(null); }
    } catch (e) { setError(e.message); }
  }

  return (
    <div style={{ maxWidth: "900px", marginTop: "20px" }}>
      {error && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "12px", marginBottom: "12px" }}>{error}</div>}
      {loading ? (
        <div style={{ color: C.muted, fontSize: "13px" }}>Yükleniyor…</div>
      ) : rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
          <History size={28} style={{ marginBottom: "10px", opacity: 0.3 }} />
          <div style={{ fontSize: "13px" }}>Henüz sürüm kaydı yok.</div>
          <div style={{ fontSize: "11px", marginTop: "4px" }}>Ayarları kaydettiğinizde otomatik oluşacak.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {rows.map(r => (
              <div key={r.id} style={{ background: C.card, border: `1px solid ${selected === r.id ? C.primary : C.border}`, borderRadius: "10px", padding: "10px 12px", boxShadow: SHADOW.card, cursor: "pointer" }} onClick={() => view(r)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: C.primary }}>v{r.version}</span>
                    <span style={{ fontSize: "10px", padding: "2px 6px", background: C.surface, borderRadius: "4px", color: C.muted }}>{r.source}</span>
                  </div>
                  <span style={{ fontSize: "10px", color: C.muted }}>{new Date(r.createdAt).toLocaleString("tr-TR")}</span>
                </div>
                {r.changeNote && <div style={{ fontSize: "11px", color: C.secondary, marginTop: "4px" }}>{r.changeNote}</div>}
                <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                  <button
                    onClick={e => { e.stopPropagation(); restore(r.id); }}
                    style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "transparent", color: C.secondary, fontSize: "11px", cursor: "pointer" }}
                  ><RotateCcw size={10} /> Geri Yükle</button>
                  <button
                    onClick={e => { e.stopPropagation(); remove(r.id); }}
                    style={{ padding: "4px 6px", border: "none", background: "transparent", color: "#DC2626", cursor: "pointer", borderRadius: "4px" }}
                  ><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px", boxShadow: SHADOW.card, maxHeight: "500px", overflowY: "auto" }}>
            {!selected ? (
              <div style={{ color: C.muted, fontSize: "12px", textAlign: "center", padding: "40px 0" }}>Bir sürüm seçin</div>
            ) : !snapshot ? (
              <div style={{ color: C.muted, fontSize: "12px" }}>Yükleniyor…</div>
            ) : (
              <pre style={{ margin: 0, fontSize: "10px", color: C.primary, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'JetBrains Mono', 'Courier New', monospace" }}>
                {snapshot.snapshot}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Personality Tab ───────────────────────────────────────────────────────────

function PersonalityTab() {
  const [settings, setSettings] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/ai-settings").then(setSettings).catch(e => setError(e.message));
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    try {
      const updated = await apiFetch("/api/admin/ai-settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleChat(val) {
    try {
      const updated = await apiFetch("/api/admin/ai-settings", {
        method: "PATCH",
        body: JSON.stringify({ aiChatEnabled: val }),
      });
      setSettings(s => ({ ...s, aiChatEnabled: updated.aiChatEnabled }));
    } catch (e) { setError(e.message); }
  }

  if (!settings) return <div style={{ padding: "20px", color: C.muted, fontSize: "13px" }}>Yükleniyor…</div>;

  const F = ({ label, children }) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ fontSize: "12px", fontWeight: 500, color: C.muted, display: "block", marginBottom: "6px" }}>{label}</label>
      {children}
    </div>
  );

  const S = ({ name, options }) => (
    <select
      value={settings[name] ?? ""}
      onChange={e => setSettings(s => ({ ...s, [name]: e.target.value }))}
      style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "13px", background: "var(--makas-surface)", color: C.primary }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  return (
    <div style={{ maxWidth: "640px", marginTop: "20px" }}>
      {/* Web Chat Toggle */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 24px", boxShadow: SHADOW.card, marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: C.primary }}>Web Chat Widgeti</div>
          <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>Salon sayfanızda ziyaretçilerin AI asistanıyla sohbet etmesini sağlar.</div>
        </div>
        <button
          onClick={() => toggleChat(!settings.aiChatEnabled)}
          style={{
            width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer", flexShrink: 0,
            background: settings.aiChatEnabled ? C.green : C.border,
            position: "relative", transition: "background 0.2s",
          }}
        >
          <span style={{
            position: "absolute", top: "3px", left: settings.aiChatEnabled ? "23px" : "3px",
            width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
            transition: "left 0.2s", display: "block",
          }} />
        </button>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px", boxShadow: SHADOW.card }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <F label="Kişilik Stili">
            <S name="personality" options={[
              { value: "professional", label: "Profesyonel" },
              { value: "friendly",     label: "Arkadaşça" },
              { value: "formal",       label: "Resmi" },
              { value: "luxury",       label: "Lüks" },
              { value: "minimal",      label: "Minimal" },
              { value: "funny",        label: "Eğlenceli" },
              { value: "casual",       label: "Rahat" },
              { value: "youthful",     label: "Genç & Dinamik" },
              { value: "premium",      label: "Premium" },
            ]} />
          </F>
          <F label="Randevu Akışı">
            <S name="bookingStyle" options={[
              { value: "guided", label: "Adım Adım Yönlendir" },
              { value: "direct", label: "Doğrudan Randevu" },
              { value: "brief",  label: "Kısa ve Öz" },
            ]} />
          </F>
          <F label="Emoji Kullanımı">
            <S name="emojiUsage" options={[
              { value: "none",     label: "Yok" },
              { value: "minimal",  label: "Minimal" },
              { value: "moderate", label: "Orta" },
              { value: "heavy",    label: "Fazla" },
            ]} />
          </F>
          <F label="Mesaj Uzunluğu">
            <S name="messageLength" options={[
              { value: "brief",    label: "Kısa" },
              { value: "medium",   label: "Orta" },
              { value: "detailed", label: "Ayrıntılı" },
            ]} />
          </F>
          <F label="Satış Davranışı">
            <S name="salesBehavior" options={[
              { value: "passive",   label: "Pasif" },
              { value: "neutral",   label: "Nötr" },
              { value: "proactive", label: "Proaktif" },
            ]} />
          </F>
          <F label="Mizah Seviyesi">
            <S name="humorLevel" options={[
              { value: "none",     label: "Yok" },
              { value: "light",    label: "Hafif" },
              { value: "moderate", label: "Orta" },
              { value: "high",     label: "Yüksek" },
            ]} />
          </F>
        </div>

        <F label="Karşılama Mesajı (isteğe bağlı)">
          <input
            value={settings.greeting ?? ""}
            onChange={e => setSettings(s => ({ ...s, greeting: e.target.value }))}
            placeholder="Örn: Merhaba! Size nasıl yardımcı olabilirim?"
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "13px", outline: "none" }}
          />
        </F>
        <F label="Kapanış Mesajı (isteğe bağlı)">
          <input
            value={settings.closing ?? ""}
            onChange={e => setSettings(s => ({ ...s, closing: e.target.value }))}
            placeholder="Örn: Başka bir konuda yardımcı olabilir miyim?"
            style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "13px", outline: "none" }}
          />
        </F>

        {error && <div style={{ padding: "10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "12px", marginBottom: "12px" }}>{error}</div>}

        <button
          onClick={save}
          disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 20px", borderRadius: "8px", background: saved ? C.green : C.primary, color: saved ? "#fff" : "var(--makas-bg)", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500, opacity: saving ? 0.7 : 1 }}
        >
          <Save size={14} /> {saved ? "Kaydedildi ✓" : saving ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

// ── Rules Tab ─────────────────────────────────────────────────────────────────

function RulesTab() {
  const [rules,    setRules]    = useState([]);
  const [newRule,  setNewRule]  = useState("");
  const [newType,  setNewType]  = useState("positive");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRules(await apiFetch("/api/admin/ai-rules")); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addRule() {
    if (!newRule.trim()) return;
    try {
      await apiFetch("/api/admin/ai-rules", { method: "POST", body: JSON.stringify({ rule: newRule.trim(), type: newType }) });
      setNewRule("");
      setNewType("positive");
      await load();
    } catch (e) { setError(e.message); }
  }

  async function toggleRule(rule) {
    try {
      const updated = await apiFetch(`/api/admin/ai-rules/${rule.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !rule.enabled }) });
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, ...updated } : r));
    } catch (e) { setError(e.message); }
  }

  async function removeRule(id) {
    if (!confirm("Bu kuralı silmek istediğinizden emin misiniz?")) return;
    try {
      await apiFetch(`/api/admin/ai-rules/${id}`, { method: "DELETE" });
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (e) { setError(e.message); }
  }

  return (
    <div style={{ maxWidth: "640px", marginTop: "20px" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px", boxShadow: SHADOW.card }}>
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "16px", lineHeight: 1.5 }}>
          AI asistanının uyması gereken özel kurallar. Düşük öncelik numarası = daha önemli.
        </div>

        {/* Add rule input */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <input
            value={newRule}
            onChange={e => setNewRule(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addRule()}
            placeholder="Örn: Asla indirim teklif etme."
            style={{ flex: 1, minWidth: "200px", padding: "9px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "13px", outline: "none" }}
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value)}
            style={{ padding: "9px 10px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "13px", background: "var(--makas-surface)", color: C.primary, cursor: "pointer" }}
          >
            <option value="positive">Pozitif</option>
            <option value="negative">Negatif (ASLA)</option>
          </select>
          <button
            onClick={addRule}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "8px", background: C.primary, color: "var(--makas-bg)", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap" }}
          >
            <Plus size={14} /> Ekle
          </button>
        </div>

        {error && <div style={{ padding: "10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "12px", marginBottom: "12px" }}>{error}</div>}

        {loading ? <div style={{ color: C.muted, fontSize: "13px" }}>Yükleniyor…</div> : rules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: C.muted, fontSize: "13px" }}>Henüz kural yok. Yukarıdan ekleyebilirsiniz.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: C.bg, borderRadius: "8px", opacity: rule.enabled ? 1 : 0.5 }}
              >
                <span style={{ fontSize: "11px", fontWeight: 600, color: C.muted, width: "20px", flexShrink: 0 }}>{idx + 1}</span>
                {rule.type === "negative" && (
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "#DC2626", background: "#FEF2F2", padding: "1px 6px", borderRadius: "4px", flexShrink: 0 }}>ASLA</span>
                )}
                <span style={{ flex: 1, fontSize: "13px", color: C.primary, lineHeight: 1.4 }}>{rule.rule}</span>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "11px", color: C.muted, flexShrink: 0 }}>
                  <input type="checkbox" checked={rule.enabled} onChange={() => toggleRule(rule)} />
                  Aktif
                </label>
                <button
                  onClick={() => removeRule(rule.id)}
                  style={{ padding: "4px", border: "none", background: "transparent", cursor: "pointer", color: "#DC2626", borderRadius: "4px", flexShrink: 0 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Advanced Tab ──────────────────────────────────────────────────────────────

function AdvancedTab() {
  const [settings, setSettings] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);
  const [preview,  setPreview]  = useState(false);

  useEffect(() => {
    apiFetch("/api/admin/ai-settings").then(setSettings).catch(e => setError(e.message));
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError(null);
    try {
      const updated = await apiFetch("/api/admin/ai-settings", {
        method: "PATCH",
        body: JSON.stringify({ systemPromptOverride: settings.systemPromptOverride || null }),
      });
      setSettings(s => ({ ...s, ...updated }));
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!settings) return <div style={{ padding: "20px", color: C.muted, fontSize: "13px" }}>Yükleniyor…</div>;

  return (
    <div style={{ maxWidth: "720px", marginTop: "20px" }}>
      <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", marginBottom: "16px", fontSize: "12px", color: "#DC2626", fontWeight: 500 }}>
        ⚠️ Bu seçenek otomatik oluşturulan sistem komutunu tamamen geçersiz kılar. Dikkatli kullanın.
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px", boxShadow: SHADOW.card }}>
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "12px", lineHeight: 1.5 }}>
          Sistem komutunu tamamen özelleştirin. Dolu ise otomatik oluşturulan prompt yerine bu kullanılır. Dikkatli kullanın.
        </div>
        <textarea
          value={settings.systemPromptOverride ?? ""}
          onChange={e => setSettings(s => ({ ...s, systemPromptOverride: e.target.value }))}
          rows={16}
          placeholder="Sistem komutunu buraya yazın. Boş bırakırsanız otomatik oluşturulan prompt kullanılır."
          style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, fontSize: "12px", fontFamily: "'JetBrains Mono', 'Courier New', monospace", resize: "vertical", lineHeight: 1.6, outline: "none" }}
        />
        {error && <div style={{ padding: "10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "12px", margin: "12px 0" }}>{error}</div>}
        <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 20px", borderRadius: "8px", background: saved ? C.green : C.primary, color: saved ? "#fff" : "var(--makas-bg)", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 500, opacity: saving ? 0.7 : 1 }}
          >
            <Save size={14} /> {saved ? "Kaydedildi ✓" : saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <button
            onClick={() => setPreview(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "8px", background: "transparent", color: C.secondary, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: "13px" }}
          >
            <Eye size={14} /> Prompt Önizle
          </button>
          {settings.systemPromptOverride && (
            <button
              onClick={() => setSettings(s => ({ ...s, systemPromptOverride: "" }))}
              style={{ padding: "9px 16px", borderRadius: "8px", background: "transparent", color: "#DC2626", border: `1px solid #FECACA`, cursor: "pointer", fontSize: "13px" }}
            >
              Temizle (Otomatiğe Dön)
            </button>
          )}
        </div>
      </div>
      {preview && <PromptPreviewModal onClose={() => setPreview(false)} />}
    </div>
  );
}
