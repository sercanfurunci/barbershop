"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, CheckCircle, ChevronDown } from "lucide-react";
import { C } from "@/lib/adminTheme";

const RULE_FIELDS = [
  {
    key: "slotInterval", label: "Slot Aralığı",
    desc: "Randevular arasındaki minimum süre",
    unit: "dk", options: [15, 20, 30, 45, 60],
  },
  {
    key: "bufferBefore", label: "Bugün için tampon süresi",
    desc: "Bugün için en erken şu kadar dakika sonrasına rezervasyon",
    unit: "dk", options: [0, 30, 60, 90, 120],
  },
  {
    key: "maxDaysAhead", label: "Maksimum ileri rezervasyon",
    desc: "Müşteriler en fazla bu kadar gün ileriye rezervasyon yapabilir",
    unit: "gün", options: [7, 14, 30, 60, 90],
  },
  {
    key: "minLeadHours", label: "Minimum önceden rezervasyon",
    desc: "Randevu saatinden en az bu kadar saat önce rezervasyon yapılmalı",
    unit: "saat", options: [0, 1, 2, 3, 4, 6, 12, 24],
  },
];

export default function RulesTab() {
  const [rules, setRules] = useState({
    slotInterval: 30,
    bufferBefore: 60,
    maxDaysAhead: 30,
    minLeadHours: 1,
  });
  const [saved, setSaved] = useState(false);

  function save() {
    // Save to localStorage for now (DB model not yet added)
    localStorage.setItem("makas-rules", JSON.stringify(rules));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  useEffect(() => {
    try {
      const stored = localStorage.getItem("makas-rules");
      if (stored) setRules(JSON.parse(stored));
    } catch {}
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "14px", color: C.primary, fontWeight: 500 }}>Randevu Kuralları</div>
          <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>Rezervasyon ve zaman yönetimi ayarları</div>
        </div>
        <div style={{ padding: "8px 0" }}>
          {RULE_FIELDS.map((f, i) => (
            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", borderBottom: i < RULE_FIELDS.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, marginBottom: "2px" }}>{f.label}</div>
                <div style={{ fontSize: "11px", color: C.secondary }}>{f.desc}</div>
              </div>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <select value={rules[f.key]} onChange={e => setRules(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                  style={{ appearance: "none", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "9px 32px 9px 14px", fontSize: "13px", color: C.primary, cursor: "pointer", outline: "none", fontFamily: "'DM Mono', monospace" }}
                >
                  {f.options.map(o => <option key={o} value={o}>{o} {f.unit}</option>)}
                </select>
                <ChevronDown size={11} style={{ position: "absolute", right: "9px", top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button onClick={save}
          className="flex items-center justify-center gap-2 w-full"
          style={{ background: C.primary, color: "var(--makas-bg)", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
        >
          <Save size={14} />
          Kaydet
        </button>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 justify-center" style={{ fontSize: "12px", color: "#15803D" }}>
            <CheckCircle size={13} /> Kaydedildi
          </motion.div>
        )}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "14px" }}>
          <div style={{ fontSize: "10px", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Mevcut Özet</div>
          {RULE_FIELDS.map(f => (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: C.secondary }}>{f.label}</span>
              <span style={{ fontSize: "12px", color: C.primary, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>{rules[f.key]} {f.unit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
