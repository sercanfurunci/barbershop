"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/common/Logo";

const C = { bg: "#F7F4EE", bgSoft: "#FDFBF7", card: "#FFFFFF", border: "#E5DED3", surface: "#EFEAE2", primary: "#111111", secondary: "#4A4A4A", muted: "#8A8480" };

export default function SuperAdminLogin() {
  const { login, role, loaded } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (loaded && role === "superadmin") router.replace("/superadmin");
  }, [loaded, role, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    setError(null);
    try {
      const user = await login(identifier, password);
      if (user?.role !== "SUPER_ADMIN") {
        setError("Bu sayfa sadece platform yöneticisi içindir.");
        return;
      }
      router.push("/superadmin");
    } catch (err) {
      setError(err.message ?? "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: C.bg }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            <Logo variant="dark" size={36} />
          </div>
          <h1 style={{ fontSize: "24px", color: C.primary, fontWeight: 300, letterSpacing: "-0.02em" }}>Platform Girişi</h1>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {error && (
            <div style={{ background: "rgba(17,17,17,0.12)", border: "1px solid rgba(17,17,17,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: C.primary }}>
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="E-posta veya kullanıcı adı"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            autoFocus
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "13px 16px", fontSize: "16px", color: C.primary, outline: "none", caretColor: C.primary }}
            onFocus={e => e.target.style.borderColor = "#333"}
            onBlur={e => e.target.style.borderColor = C.border}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "13px 48px 13px 16px", fontSize: "16px", color: C.primary, outline: "none", caretColor: C.primary, boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#333"}
              onBlur={e => e.target.style.borderColor = C.border}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, display: "flex" }}>
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !identifier || !password}
            style={{ background: loading || !identifier || !password ? "#1E1E1E" : C.primary, color: loading || !identifier || !password ? C.muted : "var(--makas-bg)", border: "none", borderRadius: "10px", padding: "14px", fontSize: "14px", fontWeight: 600, cursor: loading || !identifier || !password ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}
          >
            {loading && <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />}
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
      </div>

      <a
        href="/"
        style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", fontSize: "12px", color: C.muted, textDecoration: "none", whiteSpace: "nowrap" }}
        onMouseEnter={e => e.currentTarget.style.color = C.primary}
        onMouseLeave={e => e.currentTarget.style.color = C.muted}
      >
        ← Anasayfaya dön
      </a>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
