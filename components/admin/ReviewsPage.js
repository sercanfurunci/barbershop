"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, AlertTriangle, TrendingUp, MessageSquare, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

import { C } from "@/lib/adminTheme";
import { AdminPageHeader, DSStatTile, DSCard, DSEmptyState, DSSkeleton, DSBadge } from "@/components/ds";

function StarRow({ rating, size = 12 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= rating ? C.primary : "none"} style={{ color: n <= rating ? C.primary : C.dim }} />
      ))}
    </div>
  );
}

function BarberAvatar({ barber, size = 36 }) {
  if (barber?.profilePhoto) {
    return (
      <img
        src={barber.profilePhoto}
        alt={barber.nameTr}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${C.border}` }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, ${C.primary}, #7f1d1d)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 700, color: "#fff",
    }}>
      {barber?.avatar || "?"}
    </div>
  );
}

export default function ReviewsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [stars, setStars]     = useState(null); // null = all

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "100" });
      if (stars) qs.set("stars", String(stars));
      const res = await apiFetch(`/api/admin/reviews?${qs}`);
      setData(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [stars]);

  useEffect(() => { load(); }, [load]);

  const negativeReviews = data?.reviews?.filter((r) => r.barberRating > 0 && r.barberRating <= 3) ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Yorumlar" sub="Müşteri değerlendirmeleri ve puan dağılımı" />
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DSStatTile icon={Star}         label="Ortalama Puan"  value={data?.stats?.avgRating?.toFixed(1) ?? "—"} accent={C.primary} />
        <DSStatTile icon={MessageSquare} label="Toplam Yorum"  value={data?.stats?.totalCount ?? "—"}            accent="#2563eb" />
        <DSStatTile icon={AlertTriangle} label="Olumsuz Yorum" value={negativeReviews.length}                    accent={C.yellow} />
        <DSStatTile icon={TrendingUp}    label="Bu Hafta"      value={weekCount(data?.reviews)}                  accent={C.green} />
      </div>

      {/* Dispatch pipeline */}
      {data?.stats?.pipeline && (
        <DSCard>
          <div className="p-4 flex flex-wrap gap-5 items-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground shrink-0">Hatırlatma Kuyruğu</p>
            {[
              { label: "Bekliyor",   val: data.stats.pipeline.PENDING },
              { label: "Gönderildi", val: data.stats.pipeline.SENT },
              { label: "Tamamlandı", val: data.stats.pipeline.REVIEWED },
              { label: "Atlandı",    val: data.stats.pipeline.SKIPPED },
            ].map(({ label, val }) => (
              <span key={label} className="text-[12px] text-muted-foreground">
                {label} <strong className="text-foreground font-semibold">{val}</strong>
              </span>
            ))}
          </div>
        </DSCard>
      )}

      {/* Rating distribution */}
      {data?.stats?.distribution && (
        <DSCard>
          <div className="p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">Salon Puan Dağılımı</p>
            <div className="flex flex-col gap-2.5">
              {data.stats.distribution.map(({ stars: s, count }) => {
                const pct = data.stats.totalCount > 0 ? (count / data.stats.totalCount) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-14 shrink-0">
                      <span className="text-[12px] font-semibold text-foreground">{s}</span>
                      <Star size={10} fill="var(--makas-ink)" style={{ color: "var(--makas-ink)" }} />
                    </div>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-secondary">
                      <div
                        className="h-full rounded-full bg-foreground transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-6 text-right shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </DSCard>
      )}

      {/* Negative alerts */}
      {negativeReviews.length > 0 && (
        <div className="rounded-[14px] border p-4 space-y-3" style={{ background: "#FEF9EE", borderColor: "#FDE68A" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} style={{ color: C.yellow }} />
            <p className="text-[13px] font-semibold" style={{ color: "#92400e" }}>
              Olumsuz Geri Bildirimler ({negativeReviews.length})
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {negativeReviews.slice(0, 3).map((r) => (
              <div key={r.id} className="p-3 bg-white rounded-[10px] border" style={{ borderColor: "#FDE68A" }}>
                <div className="flex items-center gap-2 mb-1">
                  <StarRow rating={r.shopRating} size={11} />
                  <span className="text-[11px] text-muted-foreground">{r.customerName} · {r.barber?.nameTr}</span>
                </div>
                {r.comment && <p className="text-[12px] text-secondary-foreground leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      <DSCard className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <p className="text-[13px] font-semibold text-foreground">Tüm Yorumlar</p>
          <div className="flex gap-1.5 flex-wrap">
            <FilterBtn active={stars === null} onClick={() => setStars(null)}>Tümü</FilterBtn>
            {[5,4,3,2,1].map((s) => (
              <FilterBtn key={s} active={stars === s} onClick={() => setStars(s)}>
                {s}<Star size={10} fill="currentColor" style={{ marginLeft: 2, verticalAlign: "-1px" }} />
              </FilterBtn>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : data?.reviews?.length === 0 ? (
          <DSEmptyState
            icon={Star}
            title="Henüz yorum yok"
            sub="Müşteriler randevularını tamamladıktan sonra buraya görünür."
            compact
          />
        ) : (
          <div>
            {data?.reviews?.map((r, i) => (
              <div
                key={r.id}
                className="flex items-start gap-3 px-5 py-4"
                style={{ borderBottom: i < data.reviews.length - 1 ? "1px solid var(--makas-border)" : "none" }}
              >
                <BarberAvatar barber={r.barber} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[13px] font-semibold text-foreground">{r.customerName}</span>
                    <span className="text-[11px] text-muted-foreground">→ {r.barber?.nameTr}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{formatRelative(r.createdAt)}</span>
                  </div>
                  <div className="flex gap-4 mb-1.5">
                    <RatingPair label="Salon" value={r.shopRating} />
                    <RatingPair label="Berber" value={r.barberRating} />
                  </div>
                  {r.comment && (
                    <p className="text-[12px] text-secondary-foreground leading-relaxed">{r.comment}</p>
                  )}
                  {r.appointment?.service?.nameTr && (
                    <p className="text-[10px] text-muted-foreground mt-1">{r.appointment.service.nameTr}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DSCard>
    </div>
  );
}

function RatingPair({ label, value }) {
  if (!value || value <= 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</span>
      <StarRow rating={value} size={11} />
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-colors"
      style={{
        background: active ? "var(--makas-ink)" : "var(--makas-surface2)",
        color: active ? "#fff" : "var(--makas-ink-secondary)",
        border: active ? "none" : "1px solid var(--makas-border)",
      }}
    >
      {children}
    </button>
  );
}

function weekCount(reviews) {
  if (!reviews) return "—";
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return reviews.filter((r) => new Date(r.createdAt).getTime() > cutoff).length;
}

function formatRelative(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s önce`;
  const d = Math.floor(h / 24);
  return `${d}g önce`;
}
