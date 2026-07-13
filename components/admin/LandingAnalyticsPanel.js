"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Eye, Calendar, Phone, MessageCircle, MapPin, Scissors, User, CheckCircle2 } from "lucide-react";
import { DSCard } from "@/components/ds";

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
    apiFetch("/api/admin/analytics").then(setData).catch(() => setErr(true));
  }, []);

  const totalViews     = data?.counts?.page_view ?? 0;
  const totalBookClicks = data?.counts?.book_click ?? 0;
  const conv = totalViews > 0 ? Math.round((totalBookClicks / totalViews) * 1000) / 10 : null;

  return (
    <DSCard className="p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-foreground tracking-[0.01em]">Web Sitesi Etkileşimi</h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.04em]">Son 30 gün</span>
      </div>

      {err && <p className="text-[12px] text-muted-foreground py-3">Yüklenemedi.</p>}
      {!err && !data && <p className="text-[12px] text-muted-foreground py-3">Yükleniyor…</p>}

      {data && (
        <>
          {conv != null && (
            <div className="mb-3 px-3 py-2.5 bg-secondary border border-border rounded-[8px] text-[12px] text-secondary-foreground">
              <span className="text-foreground font-semibold">{conv}%</span>{" "}
              ziyaretçi Randevu Al butonuna tıkladı.
            </div>
          )}
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {ROWS_TR.map(({ key, label, Icon }) => (
              <div key={key} className="flex items-center gap-2.5 px-3 py-2.5 border border-border rounded-[8px]">
                <Icon size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-foreground leading-none">
                    {(data.counts?.[key] ?? 0).toLocaleString("tr-TR")}
                  </p>
                  <p className="text-[10px] text-muted-foreground tracking-[0.02em] mt-0.5 truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </DSCard>
  );
}
