"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, AlertTriangle, TrendingUp, MessageSquare, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

import { C } from "@/lib/adminTheme";

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

  const negativeReviews = data?.reviews?.filter((r) => r.shopRating <= 3) ?? [];

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Star} label="Ortalama Puan" value={data?.stats?.avgRating?.toFixed(1) ?? "—"} accent={C.primary} />
        <KpiCard icon={MessageSquare} label="Toplam Yorum" value={data?.stats?.totalCount ?? "—"} accent="#2563eb" />
        <KpiCard icon={AlertTriangle} label="Olumsuz Yorum" value={negativeReviews.length} accent={C.yellow} />
        <KpiCard icon={TrendingUp} label="Bu Hafta" value={weekCount(data?.reviews)} accent={C.green} />
      </div>

      {/* Dispatch pipeline */}
      {data?.stats?.pipeline && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>Hatırlatma Kuyruğu</p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: C.secondary }}>
            <span>Bekliyor <strong style={{ color: C.primary }}>{data.stats.pipeline.PENDING}</strong></span>
            <span>Gönderildi <strong style={{ color: C.primary }}>{data.stats.pipeline.SENT}</strong></span>
            <span>Tamamlandı <strong style={{ color: C.primary }}>{data.stats.pipeline.REVIEWED}</strong></span>
            <span>Atlandı <strong style={{ color: C.primary }}>{data.stats.pipeline.SKIPPED}</strong></span>
          </div>
        </div>
      )}

      {/* Rating distribution */}
      {data?.stats?.distribution && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 24px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.secondary, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>Salon Puan Dağılımı</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.stats.distribution.map(({ stars: s, count }) => {
              const pct = data.stats.totalCount > 0 ? (count / data.stats.totalCount) * 100 : 0;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, width: 60, flexShrink: 0 }}>
                    <span style={{ fontSize: 12, color: C.secondary, fontWeight: 500 }}>{s}</span>
                    <Star size={11} fill={C.primary} style={{ color: C.primary }} />
                  </div>
                  <div style={{ flex: 1, height: 6, background: C.surface, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: C.primary, borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, color: C.muted, width: 28, textAlign: "right", flexShrink: 0 }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Negative alerts */}
      {negativeReviews.length > 0 && (
        <div style={{ background: "#FEF9EE", border: "1px solid #FDE68A", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={15} style={{ color: C.yellow }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>Olumsuz Geri Bildirimler ({negativeReviews.length})</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {negativeReviews.slice(0, 3).map((r) => (
              <div key={r.id} style={{ padding: "10px 12px", background: "#fff", borderRadius: 7, border: "1px solid #FDE68A" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <StarRow rating={r.shopRating} size={11} />
                  <span style={{ fontSize: 11, color: C.muted }}>{r.customerName} · {r.barber?.nameTr}</span>
                </div>
                {r.comment && <p style={{ fontSize: 12, color: C.secondary, lineHeight: 1.5 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.primary }}>Tüm Yorumlar</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <FilterBtn active={stars === null} onClick={() => setStars(null)}>Tümü</FilterBtn>
            {[5,4,3,2,1].map((s) => (
              <FilterBtn key={s} active={stars === s} onClick={() => setStars(s)}>
                {s}<Star size={10} fill="currentColor" style={{ marginLeft: 3, verticalAlign: "-1px" }} />
              </FilterBtn>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Loader2 size={18} style={{ color: C.muted }} className="animate-spin" />
          </div>
        ) : data?.reviews?.length === 0 ? (
          <p style={{ textAlign: "center", padding: 32, fontSize: 13, color: C.muted }}>Henüz yorum yok</p>
        ) : (
          <div>
            {data?.reviews?.map((r, i) => (
              <div key={r.id} style={{
                padding: "14px 20px",
                borderBottom: i < data.reviews.length - 1 ? `1px solid ${C.border}` : "none",
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <BarberAvatar barber={r.barber} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.primary }}>{r.customerName}</span>
                    <span style={{ fontSize: 11, color: C.muted }}>→ {r.barber?.nameTr}</span>
                    <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto" }}>{formatRelative(r.createdAt)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
                    <RatingPair label="Salon" value={r.shopRating} />
                    <RatingPair label="Berber" value={r.barberRating} />
                  </div>
                  {r.comment && (
                    <p style={{ fontSize: 12, color: C.secondary, lineHeight: 1.55, marginBottom: 4 }}>{r.comment}</p>
                  )}
                  {r.appointment?.service?.nameTr && (
                    <p style={{ fontSize: 10, color: C.muted }}>{r.appointment.service.nameTr}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RatingPair({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 10, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
      <StarRow rating={value} size={11} />
    </div>
  );
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "4px 10px", borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none",
        background: active ? C.primary : C.surface,
        color: active ? "#fff" : C.secondary,
        display: "inline-flex", alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}

function KpiCard({ icon: Icon, label, value, accent }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} style={{ color: accent }} />
        </div>
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: "0.04em" }}>{label}</span>
      </div>
      <p style={{ fontSize: 22, fontWeight: 700, color: C.primary, letterSpacing: "-0.02em" }}>{value}</p>
    </div>
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
