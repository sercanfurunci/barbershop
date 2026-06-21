"use client";

// Persistent warning banner for admin + staff dashboards.
// Shown only when subscriptionStatus is PAST_DUE / SUSPENDED / CANCELLED.
// Banner copy for SUSPENDED is the exact line product agreed on.

import { AlertCircle } from "lucide-react";
import { shouldShowBillingBanner } from "@/lib/subscription";

const COPY = {
  PAST_DUE:  "Son ödeme alınamadı. Aboneliğiniz kısa sürede askıya alınabilir. Lütfen bizimle iletişime geçin.",
  SUSPENDED: "Aboneliğiniz askıya alındı. Online randevu alımı durduruldu. Yeniden aktif etmek için bizimle iletişime geçin.",
  CANCELLED: "Aboneliğiniz iptal edildi. Online randevu alımı durduruldu. Devam etmek için bizimle iletişime geçin.",
};

const STYLE = {
  PAST_DUE:  { bg: "#FEF3C7", color: "#92400E", border: "#FCD34D" },
  SUSPENDED: { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B", border: "#FCA5A5" },
};

export default function SubscriptionBanner({ shop, onUpgrade }) {
  if (!shouldShowBillingBanner(shop)) return null;
  const status = shop.subscriptionStatus;
  const s = STYLE[status] ?? STYLE.SUSPENDED;
  const text = COPY[status];

  return (
    <div
      role="alert"
      style={{
        background: s.bg, color: s.color,
        borderBottom: `1px solid ${s.border}`,
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: "10px",
        fontSize: "13px", fontWeight: 500,
        flexWrap: "wrap",
      }}
    >
      <AlertCircle size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: "200px" }}>{text}</span>
      {onUpgrade && (
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            background: s.color, color: "#fff",
            border: "none", borderRadius: "6px",
            padding: "6px 12px", fontSize: "12px", fontWeight: 700,
            cursor: "pointer", minHeight: "32px",
          }}
        >
          Detayları Gör
        </button>
      )}
    </div>
  );
}
