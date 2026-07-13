"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { fmtDate, ease } from "./shared";

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}

// ── ChangePasswordForm ────────────────────────────────────────────────────────

function ChangePasswordForm({ onDone, onError }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

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
    else { const d = await res.json().catch(() => ({})); onError(d.error || "Güncellenemedi"); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {[
        { k: "current", label: "Mevcut Şifre" },
        { k: "next",    label: "Yeni Şifre" },
        { k: "confirm", label: "Yeni Şifre (Tekrar)" },
      ].map(({ k, label }) => (
        <div key={k} className="relative">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-1.5">{label}</label>
          <input type={show ? "text" : "password"} value={form[k]} onChange={set(k)}
            className="field-inp pr-10" required />
          {k === "next" && (
            <button type="button" onClick={() => setShow(v => !v)}
              className="absolute right-3 bottom-2.5 text-muted-foreground hover:text-foreground transition-colors">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="w-full h-10 rounded-full bg-foreground text-background text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
        {loading && <Loader2 size={13} className="animate-spin" />} Şifreyi Güncelle
      </button>
    </form>
  );
}

// ── DeleteAccountConfirm ──────────────────────────────────────────────────────

function DeleteAccountConfirm({ onCancel, onDone }) {
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    const res = await fetch("/api/customer/profile", { method: "DELETE" });
    if (res.ok) { onDone(); } else { setLoading(false); toast.error("Hesap silinemedi"); }
  }

  return (
    <div className="rounded-[12px] border border-red-200 bg-red-50 p-4 space-y-3">
      <p className="text-[13px] text-red-700 leading-relaxed">
        Hesabınız kalıcı olarak silinecek. Randevularınız, favorileriniz ve yorumlarınız dahil tüm veriler silinir. Bu işlem geri alınamaz.
      </p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 h-9 rounded-full border border-border text-[13px] font-medium hover:bg-secondary transition-colors">
          Vazgeç
        </button>
        <button onClick={confirm} disabled={loading}
          className="flex-1 h-9 rounded-full bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading && <Loader2 size={13} className="animate-spin" />} Hesabı Sil
        </button>
      </div>
    </div>
  );
}

// ── ProfileTab ────────────────────────────────────────────────────────────────

export default function ProfileTab({ user, onUpdated }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ displayName: user.displayName || "", phone: user.phone || "", birthday: "", gender: "" });
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [pwMsg, setPwMsg]     = useState(null);

  useEffect(() => {
    fetch("/api/customer/profile").then(r => r.json()).then(p => {
      setProfile(p);
      setForm({
        displayName: p.displayName || "",
        phone:       p.phone || "",
        birthday:    p.birthday ? new Date(p.birthday).toISOString().slice(0, 10) : "",
        gender:      p.gender || "",
      });
    }).catch(() => {});
  }, []);

  const set = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function saveProfile(e) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName || undefined,
        phone:       form.phone       || undefined,
        birthday:    form.birthday    || undefined,
        gender:      form.gender      || undefined,
      }),
    });
    setSaving(false);
    if (res.ok) { await onUpdated?.(); toast.success("Profil güncellendi"); }
    else { const d = await res.json().catch(() => ({})); toast.error(d.error || "Güncellenemedi"); }
  }

  const initials = user.displayName
    ? user.displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "M";

  return (
    <div className="max-w-[520px] space-y-8">
      {/* Avatar hero */}
      <div className="flex items-center gap-5 p-5 rounded-[16px] border border-border bg-card"
        style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="w-16 h-16 rounded-[14px] flex items-center justify-center shrink-0"
          style={{ background: "var(--makas-ink)" }}>
          <span className="font-display font-light text-[24px] text-white">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="font-display font-semibold text-[20px] tracking-tight text-foreground truncate">
            {profile?.displayName || user.displayName || "Müşteri"}
          </p>
          <p className="text-[13px] text-muted-foreground truncate">{user.email}</p>
          {user.createdAt && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Üye: {fmtDate(user.createdAt)}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={saveProfile} className="space-y-4">
        <h3 className="font-display font-semibold text-[19px] tracking-tight text-foreground">Profil Bilgileri</h3>

        <Field label="Ad Soyad">
          <input type="text" value={form.displayName} onChange={set("displayName")}
            placeholder="Adınız Soyadınız" className="field-inp" />
        </Field>
        <Field label="E-posta">
          <input type="email" value={profile?.email ?? user.email} disabled className="field-inp opacity-50 cursor-not-allowed" />
        </Field>
        <Field label="Telefon">
          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="5xx xxx xx xx" className="field-inp" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Doğum Tarihi">
            <input type="date" value={form.birthday} onChange={set("birthday")} className="field-inp" />
          </Field>
          <Field label="Cinsiyet">
            <select value={form.gender} onChange={set("gender")} className="field-inp">
              <option value="">Belirtilmemiş</option>
              <option value="MALE">Erkek</option>
              <option value="FEMALE">Kadın</option>
              <option value="OTHER">Diğer</option>
            </select>
          </Field>
        </div>

        <button type="submit" disabled={saving}
          className="w-full h-11 rounded-full bg-foreground text-background text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2">
          {saving && <Loader2 size={15} className="animate-spin" />} Kaydet
        </button>
      </form>

      {/* Change password */}
      <div className="border-t border-border pt-6">
        <button onClick={() => setShowPw(v => !v)}
          className="flex items-center justify-between w-full text-left group">
          <div>
            <p className="font-semibold text-[15px] text-foreground">Şifre Değiştir</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Hesap güvenliğiniz için düzenli olarak güncelleyin</p>
          </div>
          <ChevronRight size={16} className={`text-muted-foreground transition-transform duration-200 ${showPw ? "rotate-90" : ""}`} />
        </button>
        <AnimatePresence>
          {showPw && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
              <div className="pt-4">
                {pwMsg && (
                  <div className={`mb-3 p-3 rounded-[10px] text-[13px] font-medium ${pwMsg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {pwMsg.text}
                  </div>
                )}
                <ChangePasswordForm
                  onDone={() => { setShowPw(false); setPwMsg({ ok: true, text: "Şifre güncellendi" }); setTimeout(() => setPwMsg(null), 3000); }}
                  onError={msg => setPwMsg({ ok: false, text: msg })}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Danger zone */}
      <div className="border-t border-border pt-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-red-500 mb-3">Tehlikeli Bölge</p>
        {!showDel ? (
          <button onClick={() => setShowDel(true)}
            className="flex items-center gap-2 text-[13px] text-red-600 hover:text-red-700 transition-colors">
            <Trash2 size={14} /> Hesabı Kalıcı Olarak Sil
          </button>
        ) : (
          <DeleteAccountConfirm onCancel={() => setShowDel(false)}
            onDone={async () => { await logout(); router.replace("/"); }} />
        )}
      </div>

      <style>{`.field-inp{width:100%;border-radius:10px;border:1px solid var(--border);background:var(--card);padding:10px 14px;font-size:14px;color:var(--foreground);outline:none;transition:box-shadow .15s}.field-inp:focus{box-shadow:0 0 0 2px color-mix(in srgb,var(--foreground) 15%,transparent)}select.field-inp{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:36px}input[type=date].field-inp{appearance:none}`}</style>
    </div>
  );
}
