"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Scissors, Calendar, Clock, Heart, User, Settings, LogOut,
  Star, MapPin, Phone, ChevronRight, X, Check, Loader2,
  Eye, EyeOff, Trash2, Bell, BellOff, MessageSquare, Pencil,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
  { id: "upcoming",  label: "Yaklaşan",  Icon: Calendar },
  { id: "history",   label: "Geçmiş",    Icon: Clock },
  { id: "favorites", label: "Favoriler", Icon: Heart },
  { id: "reviews",   label: "Yorumlarım", Icon: MessageSquare },
  { id: "profile",   label: "Profil",    Icon: User },
  { id: "settings",  label: "Ayarlar",   Icon: Settings },
];

export default function AccountPage() {
  const { user, loaded, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    if (!loaded) return;
    if (!user) { router.replace("/login?redirect=/account"); return; }
    if (user.role !== "CUSTOMER") { router.replace("/admin"); }
  }, [loaded, user, router]);

  if (!loaded || !user) return null;

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-[1100px] flex items-center justify-between px-5 h-16">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Scissors size={18} className="text-foreground" />
            <span className="font-display font-extrabold text-[18px] tracking-[-0.02em] text-foreground">MAKAS</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={14} />
            Çıkış
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-[28px] tracking-tight text-foreground">
            Merhaba, {user.displayName?.split(" ")[0] || "Misafir"} 👋
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          <nav className="md:w-52 shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0" style={{ scrollbarWidth: "none" }}>
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors text-left ${
                    tab === id
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1 min-w-0">
            {tab === "upcoming"  && <AppointmentsTab type="upcoming" />}
            {tab === "history"   && <AppointmentsTab type="history" />}
            {tab === "favorites" && <FavoritesTab />}
            {tab === "reviews"   && <MyReviewsTab />}
            {tab === "profile"   && <ProfileTab user={user} onUpdated={refreshUser} />}
            {tab === "settings"  && <SettingsTab user={user} onUpdated={refreshUser} onLogout={handleLogout} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted-foreground/40" />
      </div>
      <p className="font-semibold text-[16px] text-foreground">{title}</p>
      {sub && <p className="mt-2 text-[13px] text-muted-foreground max-w-[280px]">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Toast({ msg, ok }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-[10px] text-[13px] font-medium shadow-xl pointer-events-none ${
      ok ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
    }`}>
      {ok ? <Check size={14} /> : <X size={14} />}
      {msg}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);
  return [toast, show];
}

// ── Appointments ──────────────────────────────────────────────────────────────

function statusLabel(s) {
  return { PENDING: "Bekliyor", CONFIRMED: "Onaylandı", COMPLETED: "Tamamlandı", CANCELLED: "İptal", NOSHOW: "Gelmedi" }[s] ?? s;
}
function statusColor(s) {
  return {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-secondary text-muted-foreground border-border",
    NOSHOW: "bg-red-50 text-red-700 border-red-200",
  }[s] ?? "bg-secondary text-foreground border-border";
}

function fmtDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function AppointmentsTab({ type }) {
  const [appts, setAppts] = useState(null);
  const [toast, showToast] = useToast();
  const [reviewing, setReviewing] = useState(null); // appointment being reviewed

  useEffect(() => {
    fetch("/api/customer/appointments")
      .then(r => r.json())
      .then(data => setAppts(Array.isArray(data) ? data : []))
      .catch(() => setAppts([]));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = appts?.filter(a => {
    if (type === "upcoming") return ["PENDING", "CONFIRMED"].includes(a.status) && a.date >= today;
    return ["COMPLETED", "CANCELLED", "NOSHOW"].includes(a.status) || a.date < today;
  }) ?? [];

  const sorted = [...filtered].sort((a, b) => {
    if (type === "upcoming") return a.date < b.date ? -1 : 1;
    return a.date > b.date ? -1 : 1;
  });

  async function cancelAppt(id) {
    if (!confirm("Randevuyu iptal etmek istediğinizden emin misiniz?")) return;
    const res = await fetch(`/api/customer/appointments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "CANCELLED" } : a));
      showToast("Randevu iptal edildi");
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || "İptal edilemedi", false);
    }
  }

  if (appts === null) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={type === "upcoming" ? Calendar : Clock}
        title={type === "upcoming" ? "Yaklaşan randevunuz yok" : "Geçmiş randevu yok"}
        sub={type === "upcoming" ? "Salonları keşfedip randevu alabilirsiniz." : "Daha önce randevu almadınız."}
        action={type === "upcoming" ? <Link href="/salons" className="rounded-full bg-foreground text-background text-[13px] font-semibold px-5 py-2.5 hover:bg-foreground/90 transition-colors no-underline">Salon Bul</Link> : null}
      />
    );
  }

  return (
    <div className="space-y-3">
      {toast && <Toast {...toast} />}
      {reviewing && (
        <ReviewModal
          appt={reviewing}
          onClose={() => setReviewing(null)}
          onDone={(id) => {
            setAppts(prev => prev.map(a => a.id === id ? { ...a, reviewed: true } : a));
            setReviewing(null);
            showToast("Değerlendirme gönderildi!");
          }}
          onError={(msg) => showToast(msg, false)}
        />
      )}
      {sorted.map(appt => (
        <div key={appt.id} className="rounded-[14px] border border-border bg-card p-4 flex flex-col sm:flex-row gap-4">
          {/* Left: date block */}
          <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-[10px] bg-secondary text-foreground">
            <span className="text-[18px] font-bold leading-none">
              {new Date(appt.date).getDate()}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-0.5">
              {new Date(appt.date).toLocaleDateString("tr-TR", { month: "short" })}
            </span>
          </div>

          {/* Middle: info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-semibold text-[15px] text-foreground leading-snug">{appt.shop?.name}</p>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  {appt.barber?.nameTr && <span>{appt.barber.nameTr} · </span>}
                  {appt.service?.nameTr}
                </p>
              </div>
              <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColor(appt.status)}`}>
                {statusLabel(appt.status)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1"><Clock size={11} />{appt.time} · {appt.duration} dk</span>
              {appt.price != null && <span className="font-medium text-foreground">{Number(appt.price).toLocaleString("tr-TR")} ₺</span>}
              {appt.shop?.address && <span className="flex items-center gap-1"><MapPin size={11} />{appt.shop.address}</span>}
            </div>
          </div>

          {/* Right: actions */}
          <div className="shrink-0 flex flex-row sm:flex-col gap-2 items-center sm:items-end justify-end">
            {["PENDING", "CONFIRMED"].includes(appt.status) && appt.date >= today && (
              <button
                onClick={() => cancelAppt(appt.id)}
                className="text-[12px] font-medium text-red-600 hover:text-red-700 border border-red-200 rounded-full px-3 py-1.5 hover:bg-red-50 transition-colors"
              >
                İptal Et
              </button>
            )}
            {appt.status === "COMPLETED" && !appt.reviewed && (
              <button
                onClick={() => setReviewing(appt)}
                className="text-[12px] font-medium flex items-center gap-1 border border-border rounded-full px-3 py-1.5 hover:bg-secondary transition-colors"
              >
                <Star size={11} />
                Değerlendir
              </button>
            )}
            {appt.status === "COMPLETED" && appt.reviewed && (
              <span className="text-[11px] text-emerald-600 flex items-center gap-1"><Check size={11} />Değerlendirildi</span>
            )}
            {appt.shop?.slug && (
              <Link
                href={`/${appt.shop.slug}`}
                className="text-[12px] font-semibold rounded-full bg-foreground text-background px-3 py-1.5 no-underline hover:opacity-90 transition-opacity"
              >
                Tekrar Al
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────

function ReviewModal({ appt, onClose, onDone, onError }) {
  const [barberRating, setBarberRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleUrl, setGoogleUrl] = useState(null);

  async function submit() {
    if (!barberRating) { onError("Lütfen bir puan verin"); return; }
    setLoading(true);
    const res = await fetch("/api/customer/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: appt.id, barberRating, comment }),
    });
    setLoading(false);
    if (res.ok) {
      const d = await res.json();
      if (d.googleReviewUrl) {
        setGoogleUrl(d.googleReviewUrl);
      } else {
        onDone(appt.id);
      }
    } else {
      const d = await res.json().catch(() => ({}));
      onError(d.error || "Gönderilemedi");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={!googleUrl ? onClose : undefined}>
      <div
        className="w-full max-w-md bg-card rounded-2xl p-6 space-y-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {googleUrl ? (
          <>
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
                <Check size={26} className="text-emerald-600" />
              </div>
              <p className="font-semibold text-[17px]">Teşekkürler!</p>
              <p className="text-[13px] text-muted-foreground">Değerlendirmeniz alındı. Google&apos;da da paylaşmak ister misiniz?</p>
            </div>
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold flex items-center justify-center gap-2 no-underline hover:opacity-90 transition-opacity"
              onClick={() => onDone(appt.id)}
            >
              Google&apos;da Değerlendir
            </a>
            <button onClick={() => onDone(appt.id)} className="w-full text-[13px] text-muted-foreground hover:text-foreground">
              Hayır, teşekkürler
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[17px]">Değerlendirme</h3>
              <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
            </div>

            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Berber: {appt.barber?.nameTr || "Berber"}
              </p>
              <StarPicker value={barberRating} onChange={setBarberRating} />
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Yorumunuz (isteğe bağlı)"
              rows={3}
              className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />

            <button
              onClick={submit}
              disabled={loading || !barberRating}
              className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Gönder
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}>
          <Star
            size={28}
            fill={i <= value ? "#f59e0b" : "none"}
            color={i <= value ? "#f59e0b" : "#d1d5db"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

// ── Favorites ─────────────────────────────────────────────────────────────────

function FavoritesTab() {
  const [favs, setFavs] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    fetch("/api/customer/favorites")
      .then(r => r.json())
      .then(data => setFavs(Array.isArray(data) ? data : []))
      .catch(() => setFavs([]));
  }, []);

  async function remove(shopId) {
    const res = await fetch(`/api/customer/favorites/${shopId}`, { method: "DELETE" });
    if (res.ok) {
      setFavs(prev => prev.filter(f => f.shopId !== shopId));
      showToast("Favorilerden kaldırıldı");
    } else {
      showToast("Kaldırılamadı", false);
    }
  }

  if (favs === null) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;
  }

  if (favs.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Favori salonunuz yok"
        sub="Beğendiğiniz salonları favorilere ekleyin."
        action={<Link href="/salons" className="rounded-full bg-foreground text-background text-[13px] font-semibold px-5 py-2.5 hover:bg-foreground/90 transition-colors no-underline">Keşfet</Link>}
      />
    );
  }

  const rating = (s) => s.googleRating ?? s.avgRating;
  const ratingCount = (s) => s.googleTotalRatings ?? s.totalReviews;

  return (
    <div className="space-y-3">
      {toast && <Toast {...toast} />}
      {favs.map(({ shopId, shop }) => (
        <div key={shopId} className="flex gap-3 rounded-[14px] border border-border bg-card overflow-hidden">
          {/* Cover */}
          <div className="shrink-0 w-[90px] sm:w-[110px] bg-secondary relative">
            {shop?.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[80px]">
                <Scissors size={18} className="text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 py-3 pr-2">
            <p className="font-semibold text-[14px] text-foreground leading-snug line-clamp-1">{shop?.name}</p>
            {rating(shop) ? (
              <div className="mt-0.5 flex items-center gap-1 text-[12px]">
                <Star size={10} fill="#f59e0b" color="#f59e0b" strokeWidth={1.5} />
                <span className="font-semibold">{Number(rating(shop)).toFixed(1)}</span>
                {ratingCount(shop) ? <span className="text-muted-foreground">({ratingCount(shop)})</span> : null}
              </div>
            ) : null}
            {(shop?.addressLine || shop?.city) && (
              <p className="mt-0.5 text-[12px] text-muted-foreground flex items-center gap-1">
                <MapPin size={10} />
                {[shop.addressLine, shop.city].filter(Boolean).join(", ")}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2">
              {shop?.slug && (
                <Link
                  href={`/${shop.slug}`}
                  className="text-[12px] font-semibold rounded-full bg-foreground text-background px-3 py-1 no-underline hover:opacity-90 transition-opacity"
                >
                  Randevu Al
                </Link>
              )}
              {shop?.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1 no-underline"
                >
                  <Phone size={10} />
                  Ara
                </a>
              )}
            </div>
          </div>

          {/* Remove */}
          <button
            onClick={() => remove(shopId)}
            className="shrink-0 px-3 flex items-center text-muted-foreground/50 hover:text-red-500 transition-colors"
            aria-label="Favorilerden kaldır"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── My Reviews ───────────────────────────────────────────────────────────────

function MyReviewsTab() {
  const [reviews, setReviews] = useState(null);
  const [editing, setEditing] = useState(null); // { id, barberRating, comment }
  const [toast, showToast] = useToast();

  useEffect(() => {
    fetch("/api/customer/reviews")
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d) ? d : []))
      .catch(() => setReviews([]));
  }, []);

  async function saveEdit() {
    if (!editing) return;
    const res = await fetch(`/api/customer/reviews/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barberRating: editing.barberRating, comment: editing.comment }),
    });
    if (res.ok) {
      setReviews(prev => prev.map(r =>
        r.id === editing.id ? { ...r, barberRating: editing.barberRating, comment: editing.comment } : r
      ));
      setEditing(null);
      showToast("Yorum güncellendi");
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || "Güncellenemedi", false);
    }
  }

  async function deleteReview(id) {
    if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return;
    const res = await fetch(`/api/customer/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== id));
      showToast("Yorum silindi");
    } else {
      showToast("Silinemedi", false);
    }
  }

  if (reviews === null) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={22} className="animate-spin text-muted-foreground" /></div>;
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Henüz yorum yapmadınız"
        sub="Tamamlanan randevularınızdan berber değerlendirmesi yapabilirsiniz."
        action={<button onClick={() => {}} className="rounded-full bg-foreground text-background text-[13px] font-semibold px-5 py-2.5 hover:bg-foreground/90 transition-colors">Randevularım</button>}
      />
    );
  }

  return (
    <div className="space-y-3">
      {toast && <Toast {...toast} />}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[17px]">Yorumu Düzenle</h3>
              <button onClick={() => setEditing(null)}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Puan</p>
              <StarPicker value={editing.barberRating} onChange={v => setEditing(e => ({ ...e, barberRating: v }))} />
            </div>
            <textarea
              value={editing.comment || ""}
              onChange={e => setEditing(ed => ({ ...ed, comment: e.target.value }))}
              placeholder="Yorumunuz (isteğe bağlı)"
              rows={3}
              className="w-full rounded-[10px] border border-border bg-background px-3 py-2.5 text-[14px] resize-none focus:outline-none"
            />
            <button
              onClick={saveEdit}
              className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold hover:opacity-90 transition-opacity"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}

      {reviews.map(r => (
        <div key={r.id} className="rounded-[14px] border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-[14px] text-foreground">{r.barber?.nameTr}</p>
                <span className="text-[11px] text-muted-foreground">·</span>
                <p className="text-[13px] text-muted-foreground">{r.shop?.name}</p>
              </div>
              {r.appointment?.date && (
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {new Date(r.appointment.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  {r.appointment?.service?.nameTr && ` · ${r.appointment.service.nameTr}`}
                </p>
              )}
              <div className="mt-2 flex items-center gap-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={13} fill={i <= r.barberRating ? "#f59e0b" : "none"} color={i <= r.barberRating ? "#f59e0b" : "#d1d5db"} strokeWidth={1.5} />
                ))}
                <span className="text-[12px] font-semibold text-foreground ml-1">{r.barberRating}/5</span>
              </div>
              {r.comment && (
                <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => setEditing({ id: r.id, barberRating: r.barberRating, comment: r.comment || "" })}
                className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground border border-border rounded-full px-2.5 py-1 transition-colors"
              >
                <Pencil size={11} />
                Düzenle
              </button>
              <button
                onClick={() => deleteReview(r.id)}
                className="flex items-center gap-1 text-[12px] text-red-500 hover:text-red-700 border border-red-200 rounded-full px-2.5 py-1 transition-colors"
              >
                <Trash2 size={11} />
                Sil
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground/60">
            {new Date(r.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────

function ProfileTab({ user, onUpdated }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    displayName: user.displayName || "",
    phone: user.phone || "",
    birthday: "",
    gender: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/customer/profile").then(r => r.json()).then(p => {
      setProfile(p);
      setForm({
        displayName: p.displayName || "",
        phone: p.phone || "",
        birthday: p.birthday ? new Date(p.birthday).toISOString().slice(0, 10) : "",
        gender: p.gender || "",
      });
    }).catch(() => {});
  }, []);
  const [toast, showToast] = useToast();
  const [showPwForm, setShowPwForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName || undefined,
        phone: form.phone || undefined,
        birthday: form.birthday || undefined,
        gender: form.gender || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) {
      await onUpdated?.();
      showToast("Profil güncellendi");
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || "Güncellenemedi", false);
    }
  }

  return (
    <div className="max-w-[520px] space-y-6">
      {toast && <Toast {...toast} />}

      <form onSubmit={saveProfile} className="space-y-4">
        <h2 className="font-semibold text-[18px] text-foreground">Profil Bilgileri</h2>

        <Field label="Ad Soyad">
          <input
            type="text"
            value={form.displayName}
            onChange={set("displayName")}
            className="field-input"
            placeholder="Adınız Soyadınız"
          />
        </Field>

        <Field label="E-posta">
          <input
            type="email"
            value={profile?.email ?? user.email}
            disabled
            className="field-input opacity-50 cursor-not-allowed"
          />
        </Field>

        <Field label="Telefon">
          <input
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            className="field-input"
            placeholder="5xx xxx xx xx"
          />
        </Field>

        <Field label="Doğum Tarihi">
          <input
            type="date"
            value={form.birthday}
            onChange={set("birthday")}
            className="field-input"
          />
        </Field>

        <Field label="Cinsiyet">
          <select value={form.gender} onChange={set("gender")} className="field-input">
            <option value="">Belirtmek istemiyorum</option>
            <option value="MALE">Erkek</option>
            <option value="FEMALE">Kadın</option>
            <option value="OTHER">Diğer</option>
          </select>
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          Kaydet
        </button>
      </form>

      {/* Change Password */}
      <div className="border-t border-border pt-5">
        <button
          onClick={() => setShowPwForm(v => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-semibold text-[15px]">Şifre Değiştir</span>
          <ChevronRight size={16} className={`text-muted-foreground transition-transform ${showPwForm ? "rotate-90" : ""}`} />
        </button>
        {showPwForm && <ChangePasswordForm onDone={() => { setShowPwForm(false); showToast("Şifre güncellendi"); }} onError={msg => showToast(msg, false)} />}
      </div>

      {/* Delete Account */}
      <div className="border-t border-border pt-5">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-[13px] text-red-600 hover:text-red-700"
          >
            <Trash2 size={14} />
            Hesabı Sil
          </button>
        ) : (
          <DeleteAccountConfirm onCancel={() => setShowDeleteConfirm(false)} onDone={() => router.replace("/")} />
        )}
      </div>

      <style>{`.field-input{width:100%;border-radius:10px;border:1px solid var(--border);background:var(--card);padding:10px 14px;font-size:14px;outline:none;transition:box-shadow .15s}.field-input:focus{box-shadow:0 0 0 2px color-mix(in srgb,var(--foreground) 15%,transparent)}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ChangePasswordForm({ onDone, onError }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (form.next !== form.confirm) { onError("Yeni şifreler eşleşmiyor"); return; }
    if (form.next.length < 8) { onError("Şifre en az 8 karakter olmalı"); return; }
    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
    });
    setLoading(false);
    if (res.ok) { onDone(); }
    else {
      const d = await res.json().catch(() => ({}));
      onError(d.error || "Güncellenemedi");
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      {[
        { k: "current", label: "Mevcut Şifre" },
        { k: "next", label: "Yeni Şifre" },
        { k: "confirm", label: "Yeni Şifre (Tekrar)" },
      ].map(({ k, label }) => (
        <div key={k} className="relative">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
          <input
            type={show ? "text" : "password"}
            value={form[k]}
            onChange={set(k)}
            className="field-input pr-10"
            required
          />
          {k === "next" && (
            <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 bottom-2.5 text-muted-foreground">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-10 rounded-full bg-foreground text-background text-[13px] font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Şifreyi Güncelle
      </button>
    </form>
  );
}

function DeleteAccountConfirm({ onCancel, onDone }) {
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  async function confirm() {
    setLoading(true);
    const res = await fetch("/api/customer/profile", { method: "DELETE" });
    if (res.ok) {
      await logout();
      onDone();
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-[13px] text-red-700 font-medium">Hesabınız kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 h-9 rounded-full border border-border text-[13px] font-medium hover:bg-secondary transition-colors">
          Vazgeç
        </button>
        <button
          onClick={confirm}
          disabled={loading}
          className="flex-1 h-9 rounded-full bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading && <Loader2 size={13} className="animate-spin" />}
          Hesabı Sil
        </button>
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

function SettingsTab({ user, onUpdated, onLogout }) {
  const [prefs, setPrefs] = useState({
    notifAppt: user.notifAppt ?? true,
    notifReminder: user.notifReminder ?? true,
    notifPromo: user.notifPromo ?? false,
  });
  const [toast, showToast] = useToast();

  async function toggle(key) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
    if (res.ok) {
      await onUpdated?.();
    } else {
      setPrefs(prefs); // revert
      showToast("Kaydedilemedi", false);
    }
  }

  const notifItems = [
    { key: "notifAppt",     label: "Randevu bildirimleri",    sub: "Yeni ve değişen randevularınız için" },
    { key: "notifReminder", label: "Hatırlatmalar",           sub: "Randevunuzdan önce hatırlatıcı" },
    { key: "notifPromo",    label: "Kampanya bildirimleri",   sub: "İndirim ve fırsatlar" },
  ];

  return (
    <div className="max-w-[520px] space-y-5">
      {toast && <Toast {...toast} />}

      <div>
        <h2 className="font-semibold text-[18px] text-foreground mb-3">Bildirimler</h2>
        <div className="rounded-[14px] border border-border overflow-hidden divide-y divide-border">
          {notifItems.map(({ key, label, sub }) => (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => toggle(key)}
            >
              <div className="flex items-center gap-3">
                {prefs[key] ? <Bell size={15} className="text-foreground" /> : <BellOff size={15} className="text-muted-foreground" />}
                <div>
                  <p className="text-[14px] text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{sub}</p>
                </div>
              </div>
              <Toggle on={prefs[key]} />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-[12px] border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
        >
          <span className="text-[14px] font-medium">Çıkış Yap</span>
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? "bg-foreground" : "bg-border"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </div>
  );
}
