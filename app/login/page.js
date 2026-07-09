"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Scissors, Eye, EyeOff, AlertCircle, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";

export default function CustomerLoginPage() {
  const { user, loaded, login, refreshUser } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const _rd = params.get("redirect");
  const redirectTo = _rd && _rd.startsWith("/") && !_rd.startsWith("//") ? _rd : "/account";

  const [tab,      setTab]      = useState(params.get("tab") === "register" ? "register" : "login"); // "login" | "register"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Already authenticated customer — redirect
  useEffect(() => {
    if (!loaded) return;
    if (user?.role === "CUSTOMER") router.replace(redirectTo);
    // Business user on wrong page — send them to their dashboard
    if (user && user.role !== "CUSTOMER") router.replace("/admin");
  }, [loaded, user, router, redirectTo]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      if (u.role !== "CUSTOMER") {
        setError("Bu sayfa müşterilere özel. İşletme girişi için → /business/login");
        setLoading(false);
        return;
      }
      router.replace(redirectTo);
    } catch (err) {
      setError(err.message || "Giriş başarısız");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ displayName: name.trim(), email: email.trim(), password }),
      });
      await refreshUser();
      router.replace(redirectTo);
    } catch (err) {
      setError(err.message || "Kayıt başarısız");
      setLoading(false);
    }
  };

  if (!loaded) return null;
  if (user) return null;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Scissors size={20} className="text-foreground" />
          <span className="font-display font-extrabold text-[20px] tracking-[-0.02em] text-foreground">MAKAS</span>
        </Link>
        <Link href="/business/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          İşletme Girişi →
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center">
              <User size={24} className="text-background" />
            </div>
            <h1 className="font-display font-bold text-[26px] tracking-tight text-foreground">
              {tab === "login" ? "Hesabınıza Giriş Yapın" : "Hesap Oluşturun"}
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              {tab === "login" ? "Randevularınızı görüntüleyin ve yönetin" : "Ücretsiz hesap oluşturun"}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-[12px] border border-border bg-secondary/40 p-1 mb-6">
            {[["login", "Giriş Yap"], ["register", "Kayıt Ol"]].map(([t, label]) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 rounded-[9px] py-2 text-[13px] font-medium transition-colors ${
                  tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={tab === "login" ? handleLogin : handleRegister} className="space-y-4">
            {tab === "register" && (
              <div>
                <label className="block text-[13px] font-medium text-foreground mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="w-full rounded-[12px] border border-border bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">E-posta</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="siz@example.com"
                className="w-full rounded-[12px] border border-border bg-card px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/50 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-foreground">Şifre</label>
                {tab === "login" && (
                  <Link href="/forgot-password" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                    Şifremi unuttum
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  required
                  minLength={tab === "register" ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[12px] border border-border bg-card px-4 py-3 pr-11 text-[14px] text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {tab === "register" && (
                <p className="mt-1 text-[11px] text-muted-foreground">En az 6 karakter</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[12px] bg-foreground text-background font-semibold text-[15px] py-3.5 hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (tab === "login" ? "Giriş yapılıyor…" : "Hesap oluşturuluyor…")
                : (tab === "login" ? "Giriş Yap" : "Kayıt Ol")}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            Salon sahibi misiniz?{" "}
            <Link href="/business/login" className="font-medium text-foreground hover:underline">
              İşletme girişi
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
