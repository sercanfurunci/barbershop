"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import { apiFetch } from "@/lib/api";
import { ShieldCheck, ArrowRight, Loader2, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { C } from "@/lib/adminTheme";

export default function BarberLoginPage() {
  const { login, user, role, loaded } = useAuth();
  const shop = useShop();
  const router = useRouter();
  const [admins, setAdmins]   = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selected, setSelected] = useState(null); // { identifier, label, avatar?, role }
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const pwdRef = useRef(null);

  useEffect(() => {
    if (!shop?.id) return;
    apiFetch(`/api/staff?shopId=${shop.id}`)
      .then(({ admins: a, barbers: b }) => { setAdmins(a); setBarbers(b); })
      .catch(() => {});
  }, [shop?.id]);

  useEffect(() => {
    if (!loaded) return;
    if (role === "superadmin") { router.replace("/superadmin"); return; }
    // Only auto-redirect if the logged-in user belongs to THIS shop
    const userShopSlug = user?.shop?.slug;
    if (!userShopSlug || userShopSlug !== shop?.slug) return;
    if (role === "admin") router.replace(`/${userShopSlug}/admin`);
    else if (user?.barber?.slug) router.replace(`/${userShopSlug}/barber/${user.barber.slug}`);
  }, [role, loaded, router, user, shop?.slug]);

  useEffect(() => {
    if (selected) setTimeout(() => pwdRef.current?.focus(), 120);
  }, [selected]);

  const handleSelect = (account) => { setSelected(account); setPassword(""); setError(null); };
  const handleBack   = () => { setSelected(null); setPassword(""); setError(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) { setError("Şifre boş olamaz"); return; }
    setLoading(true);
    setError(null);
    try {
      const loggedIn = await login(selected.identifier, password);
      if (loggedIn?.role === "SUPER_ADMIN") router.push("/superadmin");
      else if (loggedIn?.role === "ADMIN" || loggedIn?.role === "RECEPTIONIST") router.push(loggedIn?.shop?.slug ? `/${loggedIn.shop.slug}/admin` : "/admin");
      else if (loggedIn?.barber?.slug && loggedIn?.shop?.slug) {
        router.push(`/${loggedIn.shop.slug}/barber/${loggedIn.barber.slug}`);
      }
    } catch (err) {
      setError(err.message ?? "Şifre yanlış");
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) return null;

  const roleLabel = (r) => r === "RECEPTIONIST" ? "Resepsiyonist" : "Yönetici";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: C.bg }}>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <div style={{ fontSize: "11px", letterSpacing: "0.3em", color: C.primary, textTransform: "uppercase", fontWeight: 600, marginBottom: "6px" }}>
          {shop?.name ?? "MAKAS"}
        </div>
        <h1 className="font-display font-light" style={{ fontSize: "clamp(28px, 4vw, 40px)", color: C.primary, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Çalışan <span style={{ fontStyle: "italic", color: C.primary }}>Girişi</span>
        </h1>
        <p style={{ fontSize: "13px", color: C.secondary, marginTop: "8px" }}>
          {selected ? "Şifrenizi girin" : "Hesabınızı seçin"}
        </p>
      </motion.div>

      <div style={{ width: "100%", maxWidth: "480px" }}>
        <AnimatePresence mode="wait">
          {!selected && (
            <motion.div key="select" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>

              {/* Admin / Receptionist accounts */}
              {admins.map((admin, i) => (
                <motion.button
                  key={admin.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => handleSelect({ identifier: admin.username ?? admin.email, label: admin.displayName ?? admin.username, role: admin.role })}
                  className="w-full text-left flex items-center gap-5 mb-3"
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "22px 24px", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(17,17,17,0.4)"; e.currentTarget.style.background = "var(--makas-surface2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                >
                  <div className="flex items-center justify-center shrink-0" style={{ width: "48px", height: "48px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "12px" }}>
                    <ShieldCheck size={20} color="#fff" />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: "15px", color: C.primary, fontWeight: 600, marginBottom: "2px" }}>{admin.displayName ?? admin.username}</div>
                    <div style={{ fontSize: "12px", color: C.secondary }}>{roleLabel(admin.role)}</div>
                  </div>
                  <ArrowRight size={16} style={{ color: C.primary }} />
                </motion.button>
              ))}

              {/* Barbers divider */}
              {barbers.length > 0 && (
                <div className="flex items-center gap-3 mb-4" style={{ marginTop: admins.length > 0 ? "8px" : 0 }}>
                  <div style={{ flex: 1, height: "1px", background: C.border }} />
                  <span style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.08em" }}>BERBERLER</span>
                  <div style={{ flex: 1, height: "1px", background: C.border }} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {barbers.map((barber, i) => (
                  <motion.button
                    key={barber.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (admins.length + i) * 0.06 }}
                    onClick={() => handleSelect({ identifier: `${barber.slug}@makas.com`, label: barber.nameTr, avatar: barber.avatar })}
                    className="text-left flex items-center gap-4"
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 18px", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(17,17,17,0.3)"; e.currentTarget.style.background = "var(--makas-surface2)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                  >
                    <div className="flex items-center justify-center font-bold text-[var(--makas-bg)] shrink-0" style={{ width: "38px", height: "38px", background: C.primary, borderRadius: "10px", fontSize: "11px" }}>
                      {barber.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: "13px", color: C.primary, fontWeight: 500, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {barber.nameTr}
                      </div>
                      <div style={{ fontSize: "10px", color: barber.available ? "#15803D" : C.muted, display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: barber.available ? "#15803D" : C.muted, flexShrink: 0 }} />
                        {barber.available ? "Müsait" : "İzinli"}
                      </div>
                    </div>
                    <ArrowRight size={13} style={{ color: C.muted, flexShrink: 0 }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {selected && (
            <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
                <div className="flex items-center justify-center shrink-0" style={{ width: "48px", height: "48px", background: `linear-gradient(135deg, ${C.primary}, #111111)`, borderRadius: "12px" }}>
                  {selected.avatar
                    ? <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{selected.avatar}</span>
                    : <ShieldCheck size={20} color="#fff" />
                  }
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: "15px", color: C.primary, fontWeight: 600 }}>{selected.label}</div>
                  <div style={{ fontSize: "11px", color: C.secondary, marginTop: "2px" }}>{selected.identifier}</div>
                </div>
                <button onClick={handleBack} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                  <ChevronLeft size={14} /> Geri
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{ background: "rgba(17,17,17,0.1)", border: "1px solid rgba(17,17,17,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: C.primary }}>
                    {error}
                  </div>
                )}
                <div style={{ position: "relative", marginBottom: "14px" }}>
                  <input
                    ref={pwdRef}
                    type={showPwd ? "text" : "password"}
                    placeholder="Şifre"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    style={{ width: "100%", background: C.card, border: `1px solid ${error ? "rgba(17,17,17,0.5)" : C.border}`, borderRadius: "10px", padding: "14px 48px 14px 16px", fontSize: "16px", color: C.primary, outline: "none", caretColor: C.primary, boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = `${C.primary}60`; }}
                    onBlur={e => { e.target.style.borderColor = error ? "rgba(17,17,17,0.5)" : C.border; }}
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading || !password}
                  className="w-full flex items-center justify-center gap-2"
                  style={{ background: loading || !password ? C.dim : C.primary, color: "var(--makas-bg)", border: "none", borderRadius: "10px", padding: "14px", fontSize: "14px", fontWeight: 600, cursor: loading || !password ? "not-allowed" : "pointer", transition: "background 0.2s", letterSpacing: "0.02em" }}
                >
                  {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.a
        href={`/${shop?.slug ?? ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ fontSize: "12px", color: C.muted, marginTop: "40px", textDecoration: "none" }}
        onMouseEnter={e => { e.currentTarget.style.color = C.secondary; }}
        onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}
      >
        ← Siteye dön
      </motion.a>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
