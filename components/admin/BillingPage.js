"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  CreditCard, Calendar, AlertCircle, Loader2,
  Users, MessageSquare, Smartphone, TrendingUp, Mail,
} from "lucide-react";

import { C } from "@/lib/adminTheme";
import {
  AdminPageHeader, DSCard, DSStatTile, DSBadge,
  DSEmptyState, DSPageLoader,
} from "@/components/ds";

const STATUS_VARIANT = {
  TRIAL:     "trial",
  ACTIVE:    "active",
  PAST_DUE:  "past_due",
  SUSPENDED: "suspended",
  CANCELLED: "cancelled",
};

const STATUS_LABEL = {
  TRIAL:     "Deneme",
  ACTIVE:    "Aktif",
  PAST_DUE:  "Ödeme Bekleniyor",
  SUSPENDED: "Askıda",
  CANCELLED: "İptal",
};

function formatTry(n) {
  return new Intl.NumberFormat("tr-TR").format(n) + " ₺";
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
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

  if (loading) return <DSPageLoader />;

  if (error || !data) {
    return (
      <DSCard className="p-5">
        <div className="flex items-center gap-2 text-destructive text-[13px]">
          <AlertCircle size={15} /> {error ?? "Veri yok"}
        </div>
      </DSCard>
    );
  }

  const { plan, subscription, usage } = data;
  const isTrial = subscription.status === "TRIAL";

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        title="Faturalama"
        sub="Plan bilgileri ve bu ayki kullanım özeti"
      />

      {/* Plan card */}
      <DSCard>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1">Mevcut Plan</p>
              <h2 className="text-[22px] font-semibold tracking-tight text-foreground">{plan.label}</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                {formatTry(plan.priceMonthlyTry)} / ay · sınırsız berber
              </p>
            </div>
            <DSBadge variant={STATUS_VARIANT[subscription.status] ?? "default"}>
              {STATUS_LABEL[subscription.status] ?? subscription.status}
            </DSBadge>
          </div>

          {/* Dates grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-[10px] bg-secondary/40 border border-border">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                {isTrial ? "Deneme başlangıcı" : "Üyelik başlangıcı"}
              </p>
              <p className="text-[13px] font-medium text-foreground">{fmtDate(subscription.startedAt)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                {isTrial ? "Deneme bitişi" : "Sonraki ödeme"}
              </p>
              <p className="text-[13px] font-medium text-foreground">
                {fmtDate(isTrial ? subscription.trialEndsAt : subscription.currentPeriodEndsAt)}
              </p>
            </div>
          </div>

          {isTrial && subscription.trialDaysLeft !== null && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-[10px] text-[12px] font-medium"
              style={{ background: "#DBEAFE", color: "#1E40AF" }}>
              <Calendar size={13} />
              Deneme süreniz <strong>{subscription.trialDaysLeft} gün</strong> sonra bitiyor.
            </div>
          )}

          {subscription.status === "PAST_DUE" && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2.5 rounded-[10px] text-[12px] font-medium"
              style={{ background: "#FEF3C7", color: "#92400E" }}>
              <AlertCircle size={13} />
              Ödeme alınamadı. Lütfen bizimle iletişime geçin.
            </div>
          )}
        </div>
      </DSCard>

      {/* Usage */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">Bu Ayki Kullanım</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <DSStatTile icon={TrendingUp}    label="Randevu"        value={usage.bookingsThisMonth} />
          <DSStatTile icon={Smartphone}    label="SMS"            value={usage.smsSent} />
          <DSStatTile icon={MessageSquare} label="WhatsApp"       value={usage.waSent} />
          <DSStatTile icon={Users}         label="Aktif Berber"   value={usage.activeBarbers} sub="/ sınırsız" />
          <DSStatTile icon={Users}         label="Toplam Müşteri" value={usage.customerCount} />
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-[14px] p-5 flex flex-col gap-3" style={{ background: "var(--makas-ink)" }}>
        <div className="flex items-center gap-3">
          <CreditCard size={18} className="text-white/70" />
          <p className="text-[15px] font-semibold text-white">Süreyi uzatmak ister misiniz?</p>
        </div>
        <p className="text-[12px] text-white/60 leading-relaxed">
          Ödeme almak için bizimle iletişime geçin. 24 saat içinde dönüş yapıyoruz.
        </p>
        <a
          href="mailto:satis@makas.app?subject=Abonelik%20Yenileme"
          className="inline-flex items-center gap-2 self-start px-4 h-10 rounded-full bg-white text-[13px] font-semibold no-underline transition-opacity hover:opacity-90"
          style={{ color: "var(--makas-ink)" }}
        >
          <Mail size={13} /> İletişime Geç
        </a>
      </div>
    </div>
  );
}
