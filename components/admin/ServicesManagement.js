"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MoreVertical, Pencil, Trash2, ToggleLeft, ToggleRight,
  Search, X, Check, AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const C = {
  bg:      "#F7F4EE",
  bgSoft:  "#FDFBF7",
  card:    "#FFFFFF",
  border:  "#E5DED3",
  surface: "#EFEAE2",
  primary: "#111111",
  secondary:"#4A4A4A",
  muted:   "#8A8480",
  dim:     "#C5BEB5",
};

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

const inputStyle = {
  width: "100%", height: "40px",
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "13px",
  color: C.primary,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = { ...inputStyle, cursor: "pointer", appearance: "none" };

function Field({ label, children, half }) {
  return (
    <div style={half ? { flex: 1, minWidth: 0 } : {}}>
      <label style={{ display: "block", fontSize: "11px", color: C.secondary, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px", fontWeight: 500 }}>
        {label}
      </label>
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
  const isEdit = !!service;
  const [form, setForm] = useState(
    isEdit
      ? {
          nameTr:    service.nameTr    ?? "",
          nameEn:    service.nameEn    ?? "",
          descTr:    service.descTr    ?? "",
          descEn:    service.descEn    ?? "",
          duration:  String(service.duration),
          price:     String(service.price),
          icon:      service.icon      ?? "✂️",
          category:  service.category  ?? "CUTS",
          popular:   service.popular   ?? false,
          active:    service.active    ?? true,
          sortOrder: String(service.sortOrder ?? 0),
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameTr.trim())          { setError("Hizmet adı gerekli"); return; }
    if (!form.duration || Number(form.duration) < 5) { setError("Süre en az 5 dk olmalı"); return; }
    if (form.price === "" || Number(form.price) < 0) { setError("Geçerli bir fiyat girin"); return; }

    setSaving(true);
    setError("");
    const body = {
      nameTr:    form.nameTr.trim(),
      nameEn:    form.nameEn.trim() || form.nameTr.trim(),
      descTr:    form.descTr.trim(),
      descEn:    form.descEn.trim(),
      duration:  Number(form.duration),
      price:     Number(form.price),
      icon:      form.icon || "✂️",
      category:  form.category,
      popular:   form.popular,
      active:    form.active,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
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
        style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.4)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "16px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}
        >
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "11px", color: C.primary, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500, marginBottom: "3px" }}>
                {isEdit ? "Hizmeti Düzenle" : "Yeni Hizmet"}
              </div>
              <h2 style={{ fontSize: "18px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em" }}>
                {isEdit ? service.nameTr : "Hizmet Ekle"}
              </h2>
            </div>
            <button onClick={onClose} style={{ width: "32px", height: "32px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.secondary }}>
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <Field label="Hizmet Adı (TR)" half>
                <input value={form.nameTr} onChange={e => set("nameTr", e.target.value)} placeholder="Saç Kesimi" style={inputStyle} />
              </Field>
              <Field label="Hizmet Adı (EN)" half>
                <input value={form.nameEn} onChange={e => set("nameEn", e.target.value)} placeholder="Haircut" style={inputStyle} />
              </Field>
            </div>

            <Field label="Açıklama (TR)">
              <textarea value={form.descTr} onChange={e => set("descTr", e.target.value)} placeholder="Kısa açıklama..." style={{ ...inputStyle, height: "64px", padding: "10px 12px", resize: "none", lineHeight: 1.5 }} />
            </Field>

            <div style={{ display: "flex", gap: "12px" }}>
              <Field label="Süre (dk)" half>
                <input type="number" min="5" step="5" value={form.duration} onChange={e => set("duration", e.target.value)} placeholder="45" style={inputStyle} />
              </Field>
              <Field label="Fiyat (₺)" half>
                <input type="number" min="0" step="10" value={form.price} onChange={e => set("price", e.target.value)} placeholder="200" style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <Field label="Kategori" half>
                <select value={form.category} onChange={e => set("category", e.target.value)} style={selectStyle}>
                  {CATEGORY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="İkon" half>
                <input value={form.icon} onChange={e => set("icon", e.target.value)} placeholder="✂️" style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <Field label="Sıra" half>
                <input type="number" min="0" value={form.sortOrder} onChange={e => set("sortOrder", e.target.value)} placeholder="0" style={inputStyle} />
              </Field>
              <div style={{ flex: 1, display: "flex", gap: "16px", alignItems: "flex-end", paddingBottom: "2px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: C.secondary }}>
                  <input type="checkbox" checked={form.popular} onChange={e => set("popular", e.target.checked)} />
                  Popüler
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", color: C.secondary }}>
                  <input type="checkbox" checked={form.active} onChange={e => set("active", e.target.checked)} />
                  Aktif
                </label>
              </div>
            </div>

            {error && (
              <div style={{ fontSize: "12px", color: C.primary, padding: "8px 12px", background: "rgba(17,17,17,0.08)", borderRadius: "6px", border: "1px solid rgba(17,17,17,0.2)" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ width: "100%", height: "44px", background: C.primary, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, letterSpacing: "0.03em" }}
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
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
      onDeleted();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.4)", zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", width: "100%", maxWidth: "360px", padding: "28px 24px", textAlign: "center" }}
        >
          <div style={{ width: "48px", height: "48px", background: "rgba(17,17,17,0.1)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertTriangle size={22} color={C.primary} />
          </div>
          <div style={{ fontSize: "16px", color: C.primary, fontWeight: 500, marginBottom: "8px" }}>Hizmeti Sil</div>
          <div style={{ fontSize: "13px", color: C.secondary, marginBottom: "24px" }}>
            <strong>{service.nameTr}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{ flex: 1, height: "40px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: "8px", fontSize: "13px", color: C.secondary, cursor: "pointer" }}>
              İptal
            </button>
            <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, height: "40px", background: C.primary, border: "none", borderRadius: "8px", fontSize: "13px", color: "#fff", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
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
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "30px", height: "30px", background: "transparent", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
        <MoreVertical size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              style={{ position: "absolute", right: 0, top: "36px", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "4px", zIndex: 20, minWidth: "160px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
            >
              {[
                { label: "Düzenle",              icon: Pencil,      action: onEdit,   color: C.secondary },
                { label: service.active ? "Pasif Yap" : "Aktif Yap", icon: service.active ? ToggleLeft : ToggleRight, action: onToggle, color: C.secondary },
                { label: "Hizmeti Sil",          icon: Trash2,      action: onDelete, color: C.primary },
              ].map(item => (
                <button key={item.label} onClick={() => { setOpen(false); item.action(); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", background: "none", border: "none", borderRadius: "7px", cursor: "pointer", fontSize: "13px", color: item.color, textAlign: "left" }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <item.icon size={13} />
                  {item.label}
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
      await apiFetch(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !service.active }),
      });
      load();
    } catch {}
  };

  const visible = catFilter === "ALL"
    ? services
    : services.filter(s => s.category === catFilter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "22px", color: C.primary, fontWeight: 300, letterSpacing: "-0.01em" }}>Hizmetler</h1>
          <p style={{ fontSize: "12px", color: C.secondary, marginTop: "2px" }}>{services.length} hizmet</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 14px", background: C.primary, color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", flexShrink: 0 }}
        >
          <Plus size={14} />
          Hizmet Ekle
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: "180px", maxWidth: "280px" }}>
          <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: C.muted, pointerEvents: "none" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hizmet ara..."
            style={{ ...inputStyle, paddingLeft: "30px", height: "36px", fontSize: "12px" }}
          />
        </div>
        {/* Category tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {[{ value: "ALL", label: "Tümü" }, ...CATEGORY_OPTIONS].map(opt => (
            <button
              key={opt.value}
              onClick={() => setCatFilter(opt.value)}
              style={{
                height: "36px", padding: "0 12px",
                background: catFilter === opt.value ? C.primary : C.card,
                color: catFilter === opt.value ? "#fff" : C.secondary,
                border: `1px solid ${catFilter === opt.value ? C.primary : C.border}`,
                borderRadius: "8px", fontSize: "12px", cursor: "pointer", fontWeight: catFilter === opt.value ? 500 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Yükleniyor...</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Hizmet bulunamadı</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Hizmet", "Kategori", "Süre", "Fiyat", "Durum", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: C.muted, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => (
                <tr
                  key={s.id}
                  style={{ borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none", opacity: s.active ? 1 : 0.5 }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface + "80"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "18px" }}>{s.icon}</span>
                      <div>
                        <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>{s.nameTr}</div>
                        {s.popular && <span style={{ fontSize: "9px", color: C.primary, letterSpacing: "0.06em", fontWeight: 600 }}>POPÜLER</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: `${CATEGORY_COLORS[s.category] ?? "#888"}18`, color: CATEGORY_COLORS[s.category] ?? "#888", border: `1px solid ${CATEGORY_COLORS[s.category] ?? "#888"}30` }}>
                      {CATEGORY_OPTIONS.find(c => c.value === s.category)?.label ?? s.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}><span style={{ fontSize: "12px", color: C.secondary }}>{s.duration} dk</span></td>
                  <td style={{ padding: "12px 16px" }}><span style={{ fontSize: "15px", color: C.primary, fontWeight: 600, letterSpacing: "-0.01em" }}>₺{s.price.toLocaleString()}</span></td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: s.active ? "rgba(22,163,74,0.1)" : "rgba(156,163,175,0.15)", color: s.active ? "#16a34a" : C.muted }}>
                      {s.active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <ServiceMenu
                      service={s}
                      onEdit={() => setEditService(s)}
                      onToggle={() => handleToggle(s)}
                      onDelete={() => setDeleteService(s)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Card list — mobile */}
      <div className="md:hidden" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Yükleniyor...</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted, fontSize: "13px" }}>Hizmet bulunamadı</div>
        ) : (
          visible.map((s, i) => (
            <div key={s.id} style={{ padding: "14px 16px", borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: "12px", opacity: s.active ? 1 : 0.5 }}>
              <div style={{ width: "40px", height: "40px", background: C.surface, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                  <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500 }}>{s.nameTr}</div>
                  {s.popular && <span style={{ fontSize: "8px", color: C.primary, letterSpacing: "0.06em", fontWeight: 600 }}>POPÜLER</span>}
                  {!s.active && <span style={{ fontSize: "8px", color: C.muted, letterSpacing: "0.06em" }}>PASİF</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "4px", background: `${CATEGORY_COLORS[s.category] ?? "#888"}18`, color: CATEGORY_COLORS[s.category] ?? "#888" }}>
                    {CATEGORY_OPTIONS.find(c => c.value === s.category)?.label ?? s.category}
                  </span>
                  <span style={{ fontSize: "11px", color: C.muted }}>{s.duration} dk</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <span style={{ fontSize: "16px", color: C.primary, fontWeight: 600 }}>₺{s.price.toLocaleString()}</span>
                <ServiceMenu
                  service={s}
                  onEdit={() => setEditService(s)}
                  onToggle={() => handleToggle(s)}
                  onDelete={() => setDeleteService(s)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {createOpen && (
        <ServiceModal onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); load(); }} />
      )}
      {editService && (
        <ServiceModal service={editService} onClose={() => setEditService(null)} onSaved={() => { setEditService(null); load(); }} />
      )}
      {deleteService && (
        <DeleteModal service={deleteService} onClose={() => setDeleteService(null)} onDeleted={() => { setDeleteService(null); load(); }} />
      )}
    </div>
  );
}
