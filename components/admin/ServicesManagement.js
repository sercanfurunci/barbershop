"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MoreVertical, Pencil, Trash2, ToggleLeft, ToggleRight,
  Search, X, AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { AdminPageHeader, DSEmptyState, DSChip, DSPageLoader } from "@/components/ds";

const CATEGORY_OPTIONS = [
  { value: "CUTS",    label: "Kesim"   },
  { value: "BEARD",   label: "Sakal"   },
  { value: "COMBO",   label: "Kombo"   },
  { value: "PREMIUM", label: "Premium" },
];

const CATEGORY_COLORS = {
  CUTS:    "#2563EB",
  BEARD:   "#B45309",
  COMBO:   "#111111",
  PREMIUM: "#6D28D9",
};

const inp = "w-full h-10 px-3 rounded-[8px] border border-border bg-card text-[13px] text-foreground outline-none focus:border-foreground/30 transition-colors";

function Field({ label, children, half }) {
  return (
    <div className={half ? "flex-1 min-w-0" : ""}>
      <label className="block text-[11px] text-secondary-foreground uppercase tracking-[0.06em] mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  );
}

/* ─── Create / Edit Modal ─── */
const EMPTY_FORM = {
  nameTr: "", nameEn: "", descTr: "", descEn: "",
  duration: "", price: "", icon: "✂️",
  category: "CUTS", popular: false, active: true, sortOrder: "0",
};

function ServiceModal({ service, onClose, onSaved }) {
  useBodyScrollLock();
  const isEdit = !!service;
  const [form, setForm] = useState(isEdit ? {
    nameTr:    service.nameTr    ?? "",
    nameEn:    service.nameEn    ?? "",
    descTr:    service.descTr    ?? "",
    descEn:    service.descEn    ?? "",
    duration:  String(service.duration),
    price:     service.price == null ? "" : String(service.price),
    icon:      service.icon      ?? "✂️",
    category:  service.category  ?? "CUTS",
    popular:   service.popular   ?? false,
    active:    service.active    ?? true,
    sortOrder: String(service.sortOrder ?? 0),
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameTr.trim())          { setError("Hizmet adı gerekli"); return; }
    if (!form.duration || Number(form.duration) < 5) { setError("Süre en az 5 dk olmalı"); return; }
    if (form.price !== "" && Number(form.price) < 0) { setError("Geçerli bir fiyat girin"); return; }

    setSaving(true); setError("");
    try {
      const body = {
        nameTr: form.nameTr.trim(), nameEn: form.nameEn.trim() || form.nameTr.trim(),
        descTr: form.descTr.trim(), descEn: form.descEn.trim(),
        duration: Number(form.duration), price: form.price === "" ? null : Number(form.price),
        icon: form.icon || "✂️", category: form.category,
        popular: form.popular, active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (isEdit) {
        await apiFetch(`/api/admin/services/${service.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/api/admin/services", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-80 flex items-center justify-center overflow-y-auto overscroll-contain"
        style={{ background: "rgba(17,17,17,0.4)", padding: "20px max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card border border-border rounded-[16px] w-full max-w-[520px] max-h-[90dvh] overflow-y-auto overscroll-contain"
        >
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-[11px] text-foreground uppercase tracking-[0.15em] font-medium mb-1">
                {isEdit ? "Hizmeti Düzenle" : "Yeni Hizmet"}
              </p>
              <h2 className="text-[18px] text-foreground font-semibold tracking-[-0.01em]">
                {isEdit ? service.nameTr : "Hizmet Ekle"}
              </h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-secondary border border-border rounded-[8px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div className="flex gap-3">
              <Field label="Hizmet Adı (TR)" half>
                <input value={form.nameTr} onChange={e => set("nameTr", e.target.value)} placeholder="Saç Kesimi" className={inp} />
              </Field>
              <Field label="Hizmet Adı (EN)" half>
                <input value={form.nameEn} onChange={e => set("nameEn", e.target.value)} placeholder="Haircut" className={inp} />
              </Field>
            </div>

            <Field label="Açıklama (TR)">
              <textarea value={form.descTr} onChange={e => set("descTr", e.target.value)} placeholder="Kısa açıklama..." rows={2} className="w-full px-3 py-2 rounded-[8px] border border-border bg-card text-[13px] text-foreground outline-none resize-none leading-relaxed focus:border-foreground/30 transition-colors" />
            </Field>

            <div className="flex gap-3">
              <Field label="Süre (dk)" half>
                <input type="number" min="5" step="5" value={form.duration} onChange={e => set("duration", e.target.value)} placeholder="45" className={inp} />
              </Field>
              <Field label="Fiyat (₺)" half>
                <input type="number" min="0" step="10" value={form.price} onChange={e => set("price", e.target.value)} placeholder="Boş bırak → Sorulur" className={inp} />
              </Field>
            </div>

            <div className="flex gap-3">
              <Field label="Kategori" half>
                <select value={form.category} onChange={e => set("category", e.target.value)} className={inp + " cursor-pointer"}>
                  {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="İkon" half>
                <input value={form.icon} onChange={e => set("icon", e.target.value)} placeholder="✂️" className={inp} />
              </Field>
            </div>

            <div className="flex gap-3">
              <Field label="Sıra" half>
                <input type="number" min="0" value={form.sortOrder} onChange={e => set("sortOrder", e.target.value)} placeholder="0" className={inp} />
              </Field>
              <div className="flex-1 flex gap-4 items-end pb-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer text-[13px] text-secondary-foreground">
                  <input type="checkbox" checked={form.popular} onChange={e => set("popular", e.target.checked)} /> Popüler
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[13px] text-secondary-foreground">
                  <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)} /> Aktif
                </label>
              </div>
            </div>

            {error && (
              <div className="text-[12px] text-foreground px-3 py-2 bg-secondary rounded-[6px] border border-border">{error}</div>
            )}

            <button
              type="submit" disabled={saving}
              className="w-full h-11 bg-foreground text-background rounded-[10px] text-[13px] font-semibold tracking-[0.03em] disabled:opacity-60 transition-opacity"
            >
              {saving ? "Kaydediliyor..." : isEdit ? "Değişiklikleri Kaydet" : "Hizmet Ekle"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Delete Confirm Modal ─── */
function DeleteModal({ service, onClose, onDeleted }) {
  useBodyScrollLock();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      onDeleted();
    } catch { setDeleting(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-80 flex items-center justify-center overflow-y-auto"
        style={{ background: "rgba(17,17,17,0.4)", padding: "20px" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-[14px] w-full max-w-[360px] p-7 text-center"
        >
          <div className="w-12 h-12 bg-secondary rounded-[12px] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-foreground" />
          </div>
          <p className="text-[16px] text-foreground font-medium mb-2">Hizmeti Sil</p>
          <p className="text-[13px] text-secondary-foreground mb-6">
            <strong>{service.nameTr}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-2.5">
            <button onClick={onClose} className="flex-1 h-10 bg-secondary border border-border rounded-[8px] text-[13px] text-secondary-foreground hover:bg-secondary/70 transition-colors">İptal</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 bg-foreground text-background rounded-[8px] text-[13px] font-semibold disabled:opacity-60">
              {deleting ? "Siliniyor..." : "Sil"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Row Dropdown ─── */
function ServiceMenu({ service, onEdit, onToggle, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="w-8 h-8 flex items-center justify-center rounded-[6px] text-muted-foreground hover:bg-secondary transition-colors">
        <MoreVertical size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-9 bg-card border border-border rounded-[10px] p-1 z-20 min-w-[160px]"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
            >
              {[
                { label: "Düzenle",          icon: Pencil,      action: onEdit,   danger: false },
                { label: service.active ? "Pasif Yap" : "Aktif Yap", icon: service.active ? ToggleLeft : ToggleRight, action: onToggle, danger: false },
                { label: "Hizmeti Sil",      icon: Trash2,      action: onDelete, danger: true },
              ].map(item => (
                <button key={item.label} onClick={() => { setOpen(false); item.action(); }}
                  className={`flex items-center gap-2 w-full px-2.5 py-2 rounded-[7px] text-[13px] hover:bg-secondary transition-colors text-left ${item.danger ? "text-destructive" : "text-secondary-foreground"}`}>
                  <item.icon size={13} /> {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─── */
export default function ServicesManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editService, setEditService] = useState(null);
  const [deleteService, setDeleteService] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const data = await apiFetch(`/api/admin/services${params}`);
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (service) => {
    try {
      await apiFetch(`/api/admin/services/${service.id}`, { method: "PATCH", body: JSON.stringify({ active: !service.active }) });
      load();
    } catch {}
  };

  const visible = catFilter === "ALL" ? services : services.filter(s => s.category === catFilter);

  return (
    <div>
      {/* Header */}
      <AdminPageHeader
        title="Hizmetler"
        sub={`${services.length} hizmet`}
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3.5 bg-foreground text-background rounded-[8px] text-[13px] font-medium"
          >
            <Plus size={14} /> Hizmet Ekle
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hizmet ara..."
            className="w-full h-9 pl-[30px] pr-3 rounded-[8px] border border-border bg-card text-[12px] text-foreground outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {[{ value: "ALL", label: "Tümü" }, ...CATEGORY_OPTIONS].map(opt => (
            <DSChip key={opt.value} active={catFilter === opt.value} onClick={() => setCatFilter(opt.value)}>
              {opt.label}
            </DSChip>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-[14px] overflow-hidden">
        {loading ? <DSPageLoader /> : visible.length === 0 ? (
          <DSEmptyState icon={Search} title="Hizmet bulunamadı" compact />
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                {["Hizmet","Kategori","Süre","Fiyat","Durum",""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/40 transition-colors"
                  style={{ opacity: s.active ? 1 : 0.5 }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[18px]">{s.icon}</span>
                      <div>
                        <p className="text-[13px] text-foreground font-medium">{s.nameTr}</p>
                        {s.popular && <span className="text-[9px] text-foreground font-semibold tracking-[0.06em]">POPÜLER</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px] border"
                      style={{ background: `${CATEGORY_COLORS[s.category] ?? "#888"}18`, color: CATEGORY_COLORS[s.category] ?? "#888", borderColor: `${CATEGORY_COLORS[s.category] ?? "#888"}30` }}>
                      {CATEGORY_OPTIONS.find(c => c.value === s.category)?.label ?? s.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-secondary-foreground">{s.duration} dk</td>
                  <td className="px-4 py-3">
                    <span className="font-display font-semibold text-[15px] text-foreground">
                      {s.price == null ? "Sorulur" : `₺${s.price.toLocaleString()}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px]"
                      style={{ background: s.active ? "rgba(22,163,74,0.1)" : "rgba(156,163,175,0.15)", color: s.active ? "#16a34a" : "#6B7280" }}>
                      {s.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <ServiceMenu service={s} onEdit={() => setEditService(s)} onToggle={() => handleToggle(s)} onDelete={() => setDeleteService(s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden bg-card border border-border rounded-[14px] overflow-hidden">
        {loading ? <DSPageLoader /> : visible.length === 0 ? (
          <DSEmptyState icon={Search} title="Hizmet bulunamadı" compact />
        ) : visible.map((s, i) => (
          <div key={s.id}
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ borderBottom: i < visible.length - 1 ? "1px solid var(--makas-border)" : "none", opacity: s.active ? 1 : 0.5 }}>
            <div className="w-10 h-10 bg-secondary rounded-[8px] flex items-center justify-center text-[18px] shrink-0">{s.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-[13px] text-foreground font-medium">{s.nameTr}</p>
                {s.popular && <span className="text-[8px] text-foreground font-semibold tracking-[0.06em]">POPÜLER</span>}
                {!s.active && <span className="text-[8px] text-muted-foreground tracking-[0.06em]">PASİF</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-1.5 py-0.5 rounded-[4px]"
                  style={{ background: `${CATEGORY_COLORS[s.category] ?? "#888"}18`, color: CATEGORY_COLORS[s.category] ?? "#888" }}>
                  {CATEGORY_OPTIONS.find(c => c.value === s.category)?.label ?? s.category}
                </span>
                <span className="text-[11px] text-muted-foreground">{s.duration} dk</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-display font-semibold text-[16px] text-foreground">{s.price == null ? "Sorulur" : `₺${s.price.toLocaleString()}`}</span>
              <ServiceMenu service={s} onEdit={() => setEditService(s)} onToggle={() => handleToggle(s)} onDelete={() => setDeleteService(s)} />
            </div>
          </div>
        ))}
      </div>

      {createOpen && <ServiceModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />}
      {editService && <ServiceModal service={editService} onClose={() => setEditService(null)} onSaved={() => { setEditService(null); load(); }} />}
      {deleteService && <DeleteModal service={deleteService} onClose={() => setDeleteService(null)} onDeleted={() => { setDeleteService(null); load(); }} />}
    </div>
  );
}
