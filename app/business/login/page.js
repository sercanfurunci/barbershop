"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Building2 } from "lucide-react";
import Logo from "@/components/common/Logo";
import { DSButton, DSInput } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";

export default function BusinessLoginPage() {
  const { user, loaded, login } = useAuth();
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // Already authenticated business user — redirect immediately
  useEffect(() => {
    if (!loaded) return;
    if (user && user.role !== "CUSTOMER") {
      router.replace(user.shop?.slug ? `/${user.shop.slug}/admin` : "/admin");
    }
  }, [loaded, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      if (u.role === "CUSTOMER") {
        setError("Bu sayfa işletme sahiplerine özel. Müşteri girişi için → /login");
        setLoading(false);
        return;
      }
      // ADMIN / BARBER / SUPER_ADMIN
      if (u.role === "SUPER_ADMIN") { router.replace("/superadmin"); return; }
      if (u.role === "BARBER" && u.barber?.slug && u.shop?.slug) {
        router.replace(`/${u.shop.slug}/barber/${u.barber.slug}`);
        return;
      }
      router.replace(u.shop?.slug ? `/${u.shop.slug}/admin` : "/admin");
    } catch (err) {
      setError(err.message || "Giriş başarısız");
      setLoading(false);
    }
  };

  // Don't flash the form while we're checking existing session
  if (!loaded) return null;
  if (user && user.role !== "CUSTOMER") return null;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Minimal top bar */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-border">
        <Logo href="/" variant="dark" size={28} />
        <Link href="/login" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          Müşteri Girişi →
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">

          {/* Icon + heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center">
              <Building2 size={24} className="text-background" />
            </div>
            <h1 className="font-display font-bold text-[26px] tracking-tight text-foreground">İşletme Girişi</h1>
            <p className="mt-2 text-[14px] text-muted-foreground">Salonunuzun yönetim paneline erişin</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-foreground mb-1.5">E-posta</label>
              <DSInput
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="salon@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-foreground">Şifre</label>
                <Link href="/api/auth/forgot-password" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                  Şifremi unuttum
                </Link>
              </div>
              <div className="relative">
                <DSInput
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-11"
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
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-[10px] bg-red-50 border border-red-200 px-4 py-3">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-700">{error}</p>
              </div>
            )}

            <DSButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full rounded-[12px]"
            >
              Giriş Yap
            </DSButton>
          </form>

          {/* Demo shortcut */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-[12px] text-muted-foreground mb-3">Sistemi denemek mi istiyorsunuz?</p>
            <DemoLoginButton />
          </div>

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            Salonunuz kayıtlı değil mi?{" "}
            <Link href="/#contact" className="font-medium text-foreground hover:underline">
              Hemen başlayın
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function DemoLoginButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDemo = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/demo", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo giriş hatası");
      router.replace(data.redirectTo || "/admin");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <DSButton
        variant="outline"
        size="sm"
        loading={loading}
        onClick={handleDemo}
        className="rounded-full"
      >
        Demo hesabıyla giriş yap
      </DSButton>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
