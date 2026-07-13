"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Check, Loader2, X, Pencil, Trash2,
  Search, BadgeCheck, ExternalLink, ChevronDown, Calendar, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Sk, EmptyState, StarPicker, ReviewStars, ease } from "./shared";

const SORT_OPTS = [
  { value: "newest",  label: "En Yeni" },
  { value: "oldest",  label: "En Eski" },
  { value: "highest", label: "En Yüksek" },
  { value: "lowest",  label: "En Düşük" },
];

export default function ReviewsTab({ onSwitchTab }) {
  const [reviews, setReviews]   = useState(null);
  const [editing, setEditing]   = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const [starFilter, setStarFilter] = useState(0);
  const [sort, setSort]         = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    fetch("/api/customer/reviews")
      .then(r => r.json())
      .then(d => setReviews(Array.isArray(d) ? d : []))
      .catch(() => setReviews([]));
  }, []);

  async function saveEdit() {
    if (!editing || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customer/reviews/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barberRating: editing.barberRating, comment: editing.comment }),
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === editing.id ? { ...r, ...editing } : r));
        setEditing(null);
        toast.success("Yorum güncellendi");
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Güncellenemedi");
      }
    } finally { setSaving(false); }
  }

  async function doDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/customer/reviews/${deleteId}`, { method: "DELETE" });
      if (res.ok) { setReviews(prev => prev.filter(r => r.id !== deleteId)); setDeleteId(null); toast.success("Yorum silindi"); }
      else toast.error("Yorum silinemedi");
    } finally { setDeleting(false); }
  }

  const q = search.trim().toLowerCase();
  const filtered = (reviews ?? []).filter(r => {
    if (starFilter > 0 && r.barberRating !== starFilter) return false;
    if (!q) return true;
    return (
      r.barber?.nameTr?.toLowerCase().includes(q) ||
      r.shop?.name?.toLowerCase().includes(q) ||
      r.appointment?.service?.nameTr?.toLowerCase().includes(q) ||
      r.comment?.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sort === "oldest")  return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "highest") return b.barberRating - a.barberRating;
    if (sort === "lowest")  return a.barberRating - b.barberRating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (reviews === null) {
    return (
      <div className="space-y-4">
        <Sk className="h-6 w-40 mb-5" />
        {[1,2].map(i => (
          <div key={i} className="rounded-[16px] border border-border bg-card p-4 animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <Sk className="w-11 h-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-4 w-32" />
                <Sk className="h-3 w-48" />
              </div>
            </div>
            <Sk className="h-3 w-28" />
            <Sk className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState icon={Star} title="Henüz yorum yazmadınız"
        sub="Tamamlanan randevularınızı değerlendirerek diğer müşterilere yardımcı olun."
        action={
          <button onClick={() => onSwitchTab?.("history")}
            className="inline-flex h-11 items-center px-6 rounded-full bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity">
            Geçmiş Randevularım
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display font-semibold text-[22px] tracking-tight text-foreground">Yorumlarım</h2>
        <span className="text-[13px] text-muted-foreground">{reviews.length} yorum</span>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input type="search" placeholder="Berber, salon veya hizmet ara…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-[10px] border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40 transition-colors" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
          {[0,5,4,3,2,1].map(s => (
            <button key={s} onClick={() => setStarFilter(v => v === s ? 0 : s)}
              className="shrink-0 flex items-center gap-1 h-10 px-3 rounded-[10px] border text-[12px] font-medium transition-all"
              style={{
                borderColor: starFilter === s ? "var(--makas-ink)" : "var(--makas-border)",
                background:  starFilter === s ? "var(--makas-ink)" : "transparent",
                color:       starFilter === s ? "#fff" : "var(--makas-ink-secondary)",
              }}>
              {s === 0 ? "Tümü" : <><Star size={11} fill="#f59e0b" color="#f59e0b" strokeWidth={0} />{s}</>}
            </button>
          ))}
        </div>
        <div className="relative shrink-0">
          <button onClick={() => setSortOpen(v => !v)}
            className="flex items-center gap-1.5 h-10 px-3 rounded-[10px] border border-border text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown size={12} style={{ transform: sortOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            {SORT_OPTS.find(o => o.value === sort)?.label}
          </button>
          <AnimatePresence>
            {sortOpen && (
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }}
                className="absolute right-0 top-full mt-1 bg-card border border-border rounded-[10px] shadow-lg z-20 py-1 min-w-[140px]"
                onMouseLeave={() => setSortOpen(false)}>
                {SORT_OPTS.map(o => (
                  <button key={o.value} onClick={() => { setSort(o.value); setSortOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[13px] hover:bg-secondary/60 transition-colors flex items-center gap-2"
                    style={{ color: sort === o.value ? "var(--makas-ink)" : "var(--makas-ink-secondary)", fontWeight: sort === o.value ? 600 : 400 }}>
                    {sort === o.value && <Check size={12} />}
                    {o.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {(search || starFilter > 0) && (
        <p className="text-[12px] text-muted-foreground">{filtered.length} yorum bulundu</p>
      )}
      {filtered.length === 0 && (search || starFilter > 0) && (
        <EmptyState icon={Search} title="Sonuç bulunamadı" sub="Farklı bir filtre deneyin."
          action={<button onClick={() => { setSearch(""); setStarFilter(0); }}
            className="inline-flex h-10 items-center px-4 rounded-full border border-border text-[13px] font-medium hover:bg-secondary/60 transition-colors">
            Temizle
          </button>}
        />
      )}

      {/* Cards */}
      <div className="space-y-5">
        {filtered.map((r, i) => {
          const avatarSrc = r.barber?.profilePhoto ||
            (r.barber?.avatar && r.barber.avatar.length > 4 ? r.barber.avatar : null);
          const initial = (r.barber?.nameTr?.[0] || "B").toUpperCase();

          return (
            <motion.div key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, delay: Math.min(i * 0.05, 0.3), ease }}
              className="rounded-[20px] border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg"
              style={{ boxShadow: "var(--shadow-card)" }}>

              {/* Header */}
              <div className="p-5 pb-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="shrink-0 w-[52px] h-[52px] rounded-[14px] overflow-hidden border border-border flex items-center justify-center"
                    style={{ background: avatarSrc ? "transparent" : "var(--makas-surface2)" }}>
                    {avatarSrc
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarSrc} alt={r.barber?.nameTr || "Berber"} className="w-full h-full object-cover" />
                      : <span className="font-display font-semibold text-[20px] text-foreground">{initial}</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[15px] text-foreground leading-snug">{r.barber?.nameTr}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <BadgeCheck size={9} /> Doğrulanmış
                          </span>
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-1 leading-snug">
                          {r.shop?.name}
                          {r.appointment?.service?.nameTr && (
                            <span className="text-muted-foreground/60"> · {r.appointment.service.nameTr}</span>
                          )}
                        </p>
                      </div>
                      {/* Desktop actions */}
                      <div className="hidden sm:flex gap-1.5 shrink-0">
                        <button onClick={() => setEditing({ id: r.id, barberRating: r.barberRating, comment: r.comment || "" })}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors">
                          <Pencil size={11} /> Düzenle
                        </button>
                        <button onClick={() => setDeleteId(r.id)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-red-500 hover:text-red-700 border border-red-200 bg-red-50/50 rounded-full px-3 py-1.5 transition-colors">
                          <Trash2 size={11} /> Sil
                        </button>
                      </div>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-2 mt-3">
                      <ReviewStars rating={r.barberRating} size={14} />
                      <span className="text-[13px] font-bold text-foreground">{r.barberRating}.0</span>
                    </div>
                  </div>
                </div>

                {/* Comment */}
                {r.comment && (
                  <p className="mt-3 text-[13px] text-secondary-foreground leading-relaxed pl-[68px]">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-secondary/20 flex-wrap">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  {r.appointment?.date && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={10} />
                      {new Date(r.appointment.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={10} />
                    {new Date(r.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {r.barber?.slug && r.shop?.slug && (
                    <Link href={`/${r.shop.slug}/berber/${r.barber.slug}`}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border bg-card rounded-full px-3 py-1.5 transition-colors no-underline">
                      <ExternalLink size={10} /> Berber
                    </Link>
                  )}
                  {r.shop?.slug && (
                    <Link href={`/${r.shop.slug}`}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border bg-card rounded-full px-3 py-1.5 transition-colors no-underline">
                      <ExternalLink size={10} /> Salon
                    </Link>
                  )}
                  {/* Mobile actions */}
                  <div className="flex sm:hidden gap-1.5">
                    <button onClick={() => setEditing({ id: r.id, barberRating: r.barberRating, comment: r.comment || "" })}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-colors">
                      <Pencil size={11} /> Düzenle
                    </button>
                    <button onClick={() => setDeleteId(r.id)}
                      className="flex items-center gap-1.5 text-[11px] font-medium text-red-500 border border-red-200 rounded-full px-3 py-1.5 transition-colors">
                      <Trash2 size={11} /> Sil
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(17,17,17,0.5)" }} onClick={() => setEditing(null)}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.22, ease }}
              className="w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl"
              style={{ background: "var(--makas-surface)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-[20px]">Yorumu Düzenle</h3>
                <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
              <StarPicker value={editing.barberRating} onChange={v => setEditing(e => ({ ...e, barberRating: v }))} />
              <textarea value={editing.comment || ""} onChange={e => setEditing(ed => ({ ...ed, comment: e.target.value }))}
                placeholder="Yorumunuz (isteğe bağlı)" rows={4}
                className="w-full rounded-[12px] border border-border bg-background px-4 py-3 text-[14px] resize-none outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow" />
              <button onClick={saveEdit} disabled={saving}
                className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />} Kaydet
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(17,17,17,0.5)" }} onClick={() => !deleting && setDeleteId(null)}>
            <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.22, ease }}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl"
              style={{ background: "var(--makas-surface)" }}
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Trash2 size={17} className="text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-[16px]">Yorumu Sil</h3>
                  <p className="text-[13px] text-muted-foreground">Bu işlem geri alınamaz.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className="flex-1 h-10 rounded-full border border-border text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  Vazgeç
                </button>
                <button onClick={doDelete} disabled={deleting}
                  className="flex-1 h-10 rounded-full bg-red-500 text-white text-[14px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting && <Loader2 size={13} className="animate-spin" />} Sil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
