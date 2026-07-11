"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Plus, Loader2, X, Check, AlertCircle, Camera, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/contexts/LanguageContext";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import ImageCropModal from "@/components/shared/ImageCropModal";

import { C } from "@/lib/adminTheme";
import { DSPageLoader } from "@/components/ds";

const DAYS_TR = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];
const DAYS_KEY = ["mon","tue","wed","thu","fri","sat","sun"];

function minToTime(min) {
  if (min == null) return "—";
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export default function BarbersManagement() {
  const { lang } = useLang();
  const [barbers, setBarbers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [menuFor, setMenuFor]     = useState(null);
  const [editTarget, setEditTarget]     = useState(null); // barber obj
  const [scheduleTarget, setScheduleTarget] = useState(null); // barber obj
  const [createOpen, setCreateOpen]     = useState(false);
  const [cropTarget, setCropTarget]     = useState(null); // { file, barberId }

  const uploadCropped = async (dataUrl) => {
    if (!cropTarget) return;
    try {
      const res = await apiFetch(`/api/admin/barbers/${cropTarget.barberId}/photo`, {
        method: "POST",
        body: JSON.stringify({ photo: dataUrl }),
      });
      setBarbers(prev => prev.map(b => b.id === cropTarget.barberId ? { ...b, profilePhoto: res.profilePhoto } : b));
    } catch (err) {
      alert(err.message || "Fotoğraf yüklenemedi");
    } finally {
      setCropTarget(null);
    }
  };

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/barbers");
      setBarbers(data);
    } catch (e) {
      setError(e.message || "Yükleme hatası");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const toggleAvailable = async (barber) => {
    setMenuFor(null);
    try {
      const updated = await apiFetch(`/api/admin/barbers/${barber.id}`, {
        method: "PATCH",
        body: JSON.stringify({ available: !barber.available }),
      });
      setBarbers((prev) => prev.map((b) => b.id === updated.id ? updated : b));
    } catch (e) {
      alert(e.message || "İşlem başarısız");
    }
  };

  const deleteBarber = async (barber) => {
    setMenuFor(null);
    if (!confirm(`"${barber.nameTr}" berberi silmek üzeresin. Devam edilsin mi?`)) return;
    try {
      await apiFetch(`/api/admin/barbers/${barber.id}`, { method: "DELETE" });
      setBarbers((prev) => prev.filter((b) => b.id !== barber.id));
    } catch (e) {
      alert(e.message || "Silme başarısız");
    }
  };

  if (loading) return <DSPageLoader />;

  if (error) {
    return <div className="py-16 text-center text-[13px] text-foreground">{error}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Barber cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {barbers.map((barber, i) => (
          <BarberCard
            key={barber.id}
            barber={barber}
            lang={lang}
            index={i}
            menuFor={menuFor}
            setMenuFor={setMenuFor}
            onEdit={() => { setMenuFor(null); setEditTarget(barber); }}
            onSchedule={() => { setMenuFor(null); setScheduleTarget(barber); }}
            onToggle={() => toggleAvailable(barber)}
            onDelete={() => deleteBarber(barber)}
            onPhotoUpdate={(id, photo) => setBarbers(prev => prev.map(b => b.id === id ? { ...b, profilePhoto: photo } : b))}
            onStartCrop={(f, id) => setCropTarget({ file: f, barberId: id })}
          />
        ))}
      </div>

      {/* Add barber button */}
      <button
        onClick={() => setCreateOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-[14px] p-5 text-[12px] uppercase tracking-[0.1em] border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
      >
        <Plus size={14} /> Yeni Berber Ekle
      </button>

      {/* Crop modal */}
      {cropTarget && (
        <ImageCropModal
          file={cropTarget.file}
          onConfirm={uploadCropped}
          onCancel={() => setCropTarget(null)}
        />
      )}

      {/* Modals */}
      <AnimatePresence>
        {editTarget && (
          <EditBarberModal
            barber={editTarget}
            onClose={() => setEditTarget(null)}
            onSaved={(updated) => {
              setBarbers((prev) => prev.map((b) => b.id === updated.id ? updated : b));
              setEditTarget(null);
            }}
          />
        )}
        {scheduleTarget && (
          <ScheduleModal
            barber={scheduleTarget}
            onClose={() => setScheduleTarget(null)}
            onSaved={() => { reload(); setScheduleTarget(null); }}
          />
        )}
        {createOpen && (
          <CreateBarberModal
            onClose={() => setCreateOpen(false)}
            onCreated={(newBarber) => {
              setBarbers((prev) => [...prev, newBarber]);
              setCreateOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Barber Card ─────────────────────────────────────────────────────────── */
function BarberCard({ barber, lang, index, menuFor, setMenuFor, onEdit, onSchedule, onToggle, onDelete, onPhotoUpdate, onStartCrop }) {
  const name  = barber.nameTr;
  const title = lang === "tr" ? barber.titleTr : (barber.titleEn || barber.titleTr);
  const bio   = lang === "tr" ? barber.bioTr   : (barber.bioEn   || barber.bioTr);
  const fileRef = useRef(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="bg-card border border-border rounded-[14px] p-5 flex flex-col"
    >
      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { const f = e.target.files?.[0]; if (f) { onStartCrop(f, barber.id); e.target.value = ""; } }} />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div style={{ position: "relative", flexShrink: 0 }}>
            {barber.profilePhoto ? (
              <Image src={barber.profilePhoto} alt={name} width={44} height={44}
                sizes="44px"
                style={{ borderRadius: 10, objectFit: "cover" }} />
            ) : (
              <div
                className="flex items-center justify-center font-bold text-white"
                style={{ width: "44px", height: "44px", background: barber.color || C.primary, borderRadius: "10px", fontSize: "14px" }}
              >
                {photoLoading ? <Loader2 size={14} className="animate-spin" /> : barber.avatar}
              </div>
            )}
          </div>
          <div>
            <div className="text-[14px] font-semibold text-foreground leading-snug">{name}</div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground leading-snug">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center h-5 px-2 text-[10px] rounded-[4px] font-medium ${barber.available ? "text-emerald-700" : "text-muted-foreground"}`}
            style={{ background: barber.available ? "rgba(34,197,94,0.1)" : "rgba(82,82,91,0.15)" }}>
            {barber.available ? "Aktif" : "İzinde"}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuFor(menuFor === barber.id ? null : barber.id)}
              className="w-7 h-7 flex items-center justify-center rounded-md"
              style={{ color: C.secondary }}
            >
              <MoreVertical size={14} />
            </button>
            {menuFor === barber.id && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                <div className="absolute right-0 mt-1 z-20 bg-card border border-border rounded-[10px] overflow-hidden min-w-[160px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                  <MI onClick={onEdit}>Düzenle</MI>
                  <MI onClick={onSchedule}>Programı Gör</MI>
                  <MI onClick={() => { setMenuFor(null); fileRef.current?.click(); }}>Fotoğraf Yükle</MI>
                  {barber.profilePhoto && <MI onClick={async () => { setMenuFor(null); await apiFetch(`/api/admin/barbers/${barber.id}/photo`, { method: "DELETE" }); onPhotoUpdate(barber.id, null); }} danger>Fotoğrafı Kaldır</MI>}
                  <MI onClick={onToggle}>{barber.available ? "İzine Al" : "Aktife Al"}</MI>
                  <MI onClick={onDelete} danger>Berberi Sil</MI>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {bio && (
        <p className="line-clamp-2 text-[12px] text-secondary-foreground leading-relaxed mb-3.5">{bio}</p>
      )}

      {barber.specialties?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {barber.specialties.map((s) => (
            <span key={s} className="text-[10px] tracking-[0.06em] px-2 py-0.5 bg-secondary border border-border rounded-[4px] text-secondary-foreground">
              {s}
            </span>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
        {[
          { label: "Deneyim", value: `${barber.yearsExp} yıl` },
          { label: "Puan",    value: barber.rating?.toFixed(1) ?? "—" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display font-semibold text-[18px] text-foreground leading-none">{s.value}</div>
            <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function MI({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-secondary transition-colors ${danger ? "text-destructive" : "text-secondary-foreground"}`}
    >
      {children}
    </button>
  );
}

/* ── Edit Barber Modal ───────────────────────────────────────────────────── */
function EditBarberModal({ barber, onClose, onSaved }) {
  const [form, setForm] = useState({
    nameTr:     barber.nameTr,
    nameEn:     barber.nameEn || "",
    titleTr:    barber.titleTr,
    titleEn:    barber.titleEn || "",
    bioTr:      barber.bioTr || "",
    bioEn:      barber.bioEn || "",
    avatar:     barber.avatar,
    yearsExp:   barber.yearsExp ?? 1,
    specialties: (barber.specialties || []).join(", "),
    color:      barber.color || "#CC1A1A",
    paymentType:    barber.paymentType    || "PERCENTAGE",
    commissionRate: barber.commissionRate ?? 50,
    fixedSalary:    barber.fixedSalary    ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const updated = await apiFetch(`/api/admin/barbers/${barber.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          yearsExp: Number(form.yearsExp),
          specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
          commissionRate: form.paymentType === "PERCENTAGE" ? Number(form.commissionRate) : 0,
          fixedSalary: form.paymentType === "FIXED" && form.fixedSalary !== "" ? Number(form.fixedSalary) : null,
        }),
      });
      onSaved(updated);
    } catch (e2) {
      setErr(e2.message || "Kayıt başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Berberi Düzenle" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Row2>
          <Field label="İsim (TR) *"><input required value={form.nameTr} onChange={set("nameTr")} className={inp} /></Field>
          <Field label="İsim (EN)"><input value={form.nameEn} onChange={set("nameEn")} className={inp} /></Field>
        </Row2>
        <Row2>
          <Field label="Unvan (TR) *"><input required value={form.titleTr} onChange={set("titleTr")} className={inp} /></Field>
          <Field label="Unvan (EN)"><input value={form.titleEn} onChange={set("titleEn")} className={inp} /></Field>
        </Row2>
        <Field label="Bio (TR)"><textarea value={form.bioTr} onChange={set("bioTr")} rows={2} className={inp} /></Field>
        <Field label="Bio (EN)"><textarea value={form.bioEn} onChange={set("bioEn")} rows={2} className={inp} /></Field>
        <Row2>
          <Field label="Avatar (2 harf)"><input required value={form.avatar} onChange={set("avatar")} maxLength={3} className={inp} /></Field>
          <Field label="Deneyim (yıl)"><input type="number" min={0} value={form.yearsExp} onChange={set("yearsExp")} className={inp} /></Field>
        </Row2>
        <Field label="Uzmanlıklar (virgülle ayır)"><input value={form.specialties} onChange={set("specialties")} placeholder="Fade, Sakal, Klasik Kesim" className={inp} /></Field>
        <CommissionFields form={form} setForm={setForm} />
        {err && <ErrMsg>{err}</ErrMsg>}
        <FormActions onClose={onClose} busy={busy} label="Kaydet" />
      </form>
    </Modal>
  );
}

/* ── Schedule Modal ──────────────────────────────────────────────────────── */
function ScheduleModal({ barber, onClose, onSaved }) {
  const [wh, setWh]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState("");

  useEffect(() => {
    apiFetch(`/api/admin/working-hours?barberId=${barber.id}`)
      .then((data) => {
        const init = {};
        for (const day of DAYS_KEY) {
          init[day] = {
            start: data[`${day}Start`] ?? null,
            end:   data[`${day}End`]   ?? null,
          };
        }
        setWh(init);
      })
      .catch(() => setErr("Program yüklenemedi"))
      .finally(() => setLoading(false));
  }, [barber.id]);

  const toggle = (day) => {
    setWh((prev) => {
      const cur = prev[day];
      if (cur.start !== null) return { ...prev, [day]: { start: null, end: null } };
      return { ...prev, [day]: { start: 600, end: 1290 } };
    });
  };

  const setTime = (day, field, val) => {
    const [h, m] = val.split(":").map(Number);
    setWh((prev) => ({ ...prev, [day]: { ...prev[day], [field]: h * 60 + m } }));
  };

  const save = async () => {
    setBusy(true);
    setErr("");
    try {
      await apiFetch("/api/admin/working-hours", {
        method: "PATCH",
        body: JSON.stringify({ barberId: barber.id, ...wh }),
      });
      onSaved();
    } catch (e) {
      setErr(e.message || "Kayıt başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`${barber.nameTr} — Program`} onClose={onClose} wide>
      {loading && <div className="flex justify-center py-8"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>}
      {!loading && wh && (
        <div className="space-y-2">
          {DAYS_KEY.map((day, i) => {
            const on = wh[day].start !== null;
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  onClick={() => toggle(day)}
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border ${on ? "bg-foreground border-foreground" : "bg-secondary border-border"}`}
                >
                  {on && <Check size={10} color="#fff" strokeWidth={3} />}
                </button>
                <span className="w-24 text-[13px] text-foreground">{DAYS_TR[i]}</span>
                {on ? (
                  <div className="flex items-center gap-2">
                    <TimeInput value={minToTime(wh[day].start)} onChange={(v) => setTime(day, "start", v)} />
                    <span className="text-[12px] text-muted-foreground">—</span>
                    <TimeInput value={minToTime(wh[day].end)} onChange={(v) => setTime(day, "end", v)} />
                  </div>
                ) : (
                  <span className="text-[12px] text-muted-foreground">Kapalı</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {err && <ErrMsg>{err}</ErrMsg>}
      {!loading && (
        <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] text-foreground bg-secondary border border-border">İptal</button>
          <button onClick={save} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium bg-foreground text-background disabled:opacity-60">
            {busy && <Loader2 size={13} className="animate-spin" />} Kaydet
          </button>
        </div>
      )}
    </Modal>
  );
}

function TimeInput({ value, onChange }) {
  const safe = value === "—" ? "10:00" : value;
  return (
    <input
      type="time"
      value={safe}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 rounded-[8px] text-[13px] outline-none bg-secondary border border-border text-foreground"
    />
  );
}

/* ── Create Barber Modal ─────────────────────────────────────────────────── */
function CreateBarberModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    slug: "", nameTr: "", titleTr: "", avatar: "", yearsExp: 1, specialties: "", email: "", password: "",
    paymentType: "PERCENTAGE", commissionRate: 50, fixedSalary: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const barber = await apiFetch("/api/admin/barbers", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          yearsExp: Number(form.yearsExp),
          specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
          commissionRate: form.paymentType === "PERCENTAGE" ? Number(form.commissionRate) : 0,
          fixedSalary: form.paymentType === "FIXED" && form.fixedSalary !== "" ? Number(form.fixedSalary) : null,
        }),
      });
      onCreated(barber);
    } catch (e2) {
      setErr(e2.message || "Oluşturma başarısız");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Yeni Berber" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Row2>
          <Field label="İsim *"><input required value={form.nameTr} onChange={set("nameTr")} className={inp} /></Field>
          <Field label="Slug *" hint="küçük harf, tire"><input required value={form.slug} onChange={set("slug")} placeholder="mehmet" className={inp} /></Field>
        </Row2>
        <Field label="Unvan *"><input required value={form.titleTr} onChange={set("titleTr")} placeholder="Berber" className={inp} /></Field>
        <Row2>
          <Field label="Avatar (2 harf) *"><input required value={form.avatar} onChange={set("avatar")} maxLength={3} placeholder="MK" className={inp} /></Field>
          <Field label="Deneyim (yıl)"><input type="number" min={0} value={form.yearsExp} onChange={set("yearsExp")} className={inp} /></Field>
        </Row2>
        <Field label="Uzmanlıklar (virgülle ayır)"><input value={form.specialties} onChange={set("specialties")} placeholder="Fade, Sakal" className={inp} /></Field>
        <Field label="Giriş E-postası *" hint="Şifre sıfırlama için gerçek mail girilmeli">
          <input required type="email" value={form.email} onChange={set("email")} placeholder="berber@gmail.com" className={inp} />
        </Field>
        <Field label="Giriş Şifresi *" hint="Berber bu şifreyle giriş yapacak (sonradan değiştirilebilir)">
          <input required type="password" value={form.password} onChange={set("password")} placeholder="Min. 6 karakter" className={inp} />
        </Field>
        <CommissionFields form={form} setForm={setForm} />
        {err && <ErrMsg>{err}</ErrMsg>}
        <FormActions onClose={onClose} busy={busy} label="Ekle" />
      </form>
    </Modal>
  );
}

/* ── Commission fields (shared between Edit + Create) ─────────────────────── */
function CommissionFields({ form, setForm }) {
  const isPct = form.paymentType === "PERCENTAGE";
  return (
    <Row2>
      <Field label="Ödeme Tipi" hint={isPct ? "Komisyon: ciroya göre pay" : "Sabit maaş: cironun tamamı dükkana"}>
        <select
          value={form.paymentType}
          onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
          className={inp}
        >
          <option value="PERCENTAGE">Komisyon (%)</option>
          <option value="FIXED">Sabit Maaş</option>
        </select>
      </Field>
      {isPct ? (
        <Field label="Komisyon Oranı (%)" hint="Berber payı; 50 = yarı yarıya">
          <input
            type="number" min={0} max={100} step={1}
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
            className={inp}
          />
        </Field>
      ) : (
        <Field label="Aylık Maaş (TL)" hint="Bilgi amaçlı; rapor sayfasında gösterilir">
          <input
            type="number" min={0} step={100}
            value={form.fixedSalary}
            onChange={(e) => setForm({ ...form, fixedSalary: e.target.value })}
            placeholder="Örn. 25000" className={inp}
          />
        </Field>
      )}
    </Row2>
  );
}

/* ── Shared UI pieces ────────────────────────────────────────────────────── */
const inp = "w-full px-3 py-2 text-[13px] rounded-[10px] outline-none bg-transparent text-foreground";

function Modal({ title, onClose, children, wide }) {
  useBodyScrollLock();
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(17,17,17,0.45)",
        overflowY: "auto",
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
        padding: "16px max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className={`w-full rounded-[20px] bg-card border border-border flex flex-col max-h-[90dvh] ${wide ? "max-w-[560px]" : "max-w-[480px]"}`}
      >
        <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-border">
          <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
        </div>
        <div
          className="px-5 py-5"
          style={{
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium text-foreground mb-1">{label}</div>
      <div className="rounded-[10px] bg-secondary border border-border">{children}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </label>
  );
}

function Row2({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function ErrMsg({ children }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px] text-foreground bg-secondary">
      <AlertCircle size={13} /> {children}
    </div>
  );
}

function FormActions({ onClose, busy, label }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 rounded-[10px] text-[13px] text-foreground bg-secondary border border-border">İptal</button>
      <button type="submit" disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium bg-foreground text-background disabled:opacity-60">
        {busy && <Loader2 size={13} className="animate-spin" />} {label}
      </button>
    </div>
  );
}


// Resize image to maxDim px and return base64 data URL
function resizeImage(file, maxDim = 300) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}
