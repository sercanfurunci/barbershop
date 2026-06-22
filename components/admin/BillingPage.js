"use client";

// Read-only billing dashboard. Upgrades are sales-led for now, so there is no
// in-app purchase flow — the CTA is a contact prompt. Wire iyzico later and
// flip the CTA into a real /api/payments/checkout call.

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  CreditCard, Calendar, AlertCircle, Loader2,
  Users, MessageSquare, Smartphone, TrendingUp, Mail,
} from "lucide-react";

const C = {
  bg:        "#F7F4EE",
  card:      "#FFFFFF",
  border:    "#E5DED3",
  primary:   "#111111",
  secondary: "#4A4A4A",
  muted:     "#8A8480",
};

const STATUS_BADGE = {
  TRIAL:     { bg: "#DBEAFE", color: "#1E40AF", label: "Deneme" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46", label: "Aktif" },
  PAST_DUE:  { bg: "#FEF3C7", color: "#92400E", label: "Ödeme Bekleniyor" },
  SUSPENDED: { bg: "#FEE2E2", color: "#991B1B", label: "Askıda" },
  CANCELLED: { bg: "#F3F4F6", color: "#6B7280", label: "İptal" },
};

function StatusBadge({ status }) {
  const s = STATUS_BADGE[status] ?? STATUS_BADGE.TRIAL;
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: "11px", fontWeight: 700,
      padding: "4px 10px", borderRadius: "100px", letterSpacing: "0.02em",
    }}>{s.label}</span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px",
      padding: "20px", display: "flex", flexDirection: "column", gap: "12px",
      ...style,
    }}>{children}</div>
  );
}

function StatTile({ Icon, label, value, hint }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Icon size={16} color={C.muted} />
        <span style={{ fontSize: "11px", color: C.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: "24px", fontWeight: 700, color: C.primary, lineHeight: 1 }}>{value}</div>
      {hint && <div style={{ fontSize: "11px", color: C.muted }}>{hint}</div>}
    </Card>
  );
}

function formatTry(n) {
  return new Intl.NumberFormat("tr-TR").format(n) + " ₺";
}

export default function BillingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/admin/billing")
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message ?? "Yüklenemedi"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px", color: C.muted }}>
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#991B1B" }}>
          <AlertCircle size={16} /> {error ?? "Veri yok"}
        </div>
      </Card>
    );
  }

  const { plan, subscription, usage } = data;
  const isTrial = subscription.status === "TRIAL";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "960px" }}>
      {/* Plan + status card */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "11px", color: C.muted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "4px" }}>
              Mevcut Plan
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: C.primary }}>{plan.label}</div>
            <div style={{ fontSize: "13px", color: C.secondary, marginTop: "2px" }}>
              {formatTry(plan.priceMonthlyTry)} / ay • sınırsız berber
            </div>
          </div>
          <StatusBadge status={subscription.status} />
        </div>

        {isTrial && subscription.trialDaysLeft !== null && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 12px", background: "#DBEAFE", borderRadius: "8px",
            fontSize: "12px", color: "#1E40AF",
          }}>
            <Calendar size={14} />
            Deneme süreniz {subscription.trialDaysLeft} gün sonra bitiyor.
          </div>
        )}

        {subscription.status === "PAST_DUE" && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 12px", background: "#FEF3C7", borderRadius: "8px",
            fontSize: "12px", color: "#92400E",
          }}>
            <AlertCircle size={14} />
            Ödeme alınamadı. Lütfen bizimle iletişime geçin.
          </div>
        )}
      </Card>

      {/* Usage this month */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: C.primary, marginBottom: "8px" }}>
          Bu Ayki Kullanım
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
          <StatTile Icon={TrendingUp}  label="Randevu"     value={usage.bookingsThisMonth} />
          <StatTile Icon={Smartphone}  label="SMS"         value={usage.smsSent} />
          <StatTile Icon={MessageSquare} label="WhatsApp"  value={usage.waSent} />
          <StatTile Icon={Users}       label="Aktif Berber" value={usage.activeBarbers} hint="sınırsız" />
          <StatTile Icon={Users}       label="Toplam Müşteri" value={usage.customerCount} />
        </div>
      </div>

      {/* Renew / contact CTA — sales-led, no online checkout yet */}
      <Card style={{ background: C.primary, border: "none", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <CreditCard size={18} />
          <div style={{ fontSize: "15px", fontWeight: 700 }}>Süreyi uzatmak ister misiniz?</div>
        </div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>
          Ödeme almak için bizimle iletişime geçin. 24 saat içinde dönüş yapıyoruz.
        </div>
        <a
          href="mailto:satis@makas.app?subject=Abonelik%20Yenileme"
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "#fff", color: C.primary, fontWeight: 700,
            fontSize: "13px", padding: "10px 16px", borderRadius: "8px",
            textDecoration: "none", alignSelf: "flex-start", minHeight: "44px",
          }}
        >
          <Mail size={14} /> İletişime Geç
        </a>
      </Card>
    </div>
  );
}
