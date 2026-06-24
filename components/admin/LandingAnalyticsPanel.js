"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Eye, Calendar, Phone, MessageCircle, MapPin, Scissors, User, CheckCircle2 } from "lucide-react";

const C = {
  card: "#FFFFFF", border: "#E5DED3",
  primary: "#111111", secondary: "#4A4A4A", muted: "#8A8480",
};

// label/icon per analytics event. Keep in sync with EVENT_TYPES in lib/analytics.js.
const ROWS_TR = [
  { key: "page_view",        label: "Sayfa Görüntüleme", Icon: Eye },
  { key: "book_click",       label: "Randevu Tıklama",   Icon: Calendar },
  { key: "whatsapp_click",   label: "WhatsApp",          Icon: MessageCircle },
  { key: "call_click",       label: "Telefon",           Icon: Phone },
  { key: "directions_click", label: "Yol Tarifi",        Icon: MapPin },
  { key: "service_select",   label: "Hizmet Seçim",      Icon: Scissors },
  { key: "barber_select",    label: "Berber Seçim",      Icon: User },
  { key: "booking_complete", label: "Randevu Onay",      Icon: CheckCircle2 },
];

export default function LandingAnalyticsPanel() {
  const [data, setData] = useState(null);
  const [err, setErr]   = useState(false);

  useEffect(() => {
    apiFetch("/api/admin/analytics")
      .then(setData)
      .catch(() => setErr(true));
  }, []);

  const totalViews = data?.counts?.page_view ?? 0;
  const totalBookClicks = data?.counts?.book_click ?? 0;
  const conv = totalViews > 0 ? Math.round((totalBookClicks / totalViews) * 1000) / 10 : null;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: C.primary, letterSpacing: "0.01em" }}>
          Web Sitesi Etkileşimi
        </h3>
        <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>Son 30 gün</span>
      </div>

      {err && (
        <div style={{ fontSize: 12, color: C.muted, padding: "12px 0" }}>Yüklenemedi.</div>
      )}

      {!err && !data && (
        <div style={{ fontSize: 12, color: C.muted, padding: "12px 0" }}>Yükleniyor…</div>
      )}

      {data && (
        <>
          {conv != null && (
            <div style={{
              marginBottom: 12, padding: "10px 12px",
              background: "#F7F4EE", border: `1px solid ${C.border}`, borderRadius: 8,
              fontSize: 12, color: C.secondary,
            }}>
              <span style={{ color: C.primary, fontWeight: 600 }}>{conv}%</span>{" "}
              ziyaretçi Randevu Al butonuna tıkladı.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
            {ROWS_TR.map(({ key, label, Icon }) => (
              <div key={key} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8,
              }}>
                <Icon size={14} style={{ color: C.muted, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.primary, lineHeight: 1 }}>
                    {(data.counts?.[key] ?? 0).toLocaleString("tr-TR")}
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, letterSpacing: "0.02em", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
