"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Building2, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthNav() {
  const { user, loaded, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!loaded) {
    // Reserve space to avoid layout shift
    return <div className="w-24 h-8" />;
  }

  // ── Authenticated: business user ──────────────────────────────────────────
  if (user && user.role !== "CUSTOMER") {
    const dashLink = user.role === "SUPER_ADMIN"
      ? "/superadmin"
      : user.role === "BARBER" && user.barber?.slug && user.shop?.slug
      ? `/${user.shop.slug}/barber/${user.barber.slug}`
      : user.shop?.slug
      ? `/${user.shop.slug}/admin`
      : "/dashboard";

    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-card text-[13px] font-medium text-foreground hover:border-foreground/30 transition-colors"
        >
          <LayoutDashboard size={13} />
          {user.shop?.name || user.displayName || "Dashboard"}
          <ChevronDown size={12} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-[14px] border border-border bg-card shadow-lg overflow-hidden z-50">
            <Link
              href={dashLink}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-foreground hover:bg-secondary transition-colors no-underline"
            >
              <LayoutDashboard size={14} />
              Yönetim Paneli
            </Link>
            <div className="border-t border-border" />
            <button
              onClick={async () => { setOpen(false); await logout(); router.replace("/"); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Authenticated: customer ───────────────────────────────────────────────
  if (user?.role === "CUSTOMER") {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border bg-card text-[13px] font-medium text-foreground hover:border-foreground/30 transition-colors"
        >
          <User size={13} />
          {user.displayName?.split(" ")[0] || "Hesabım"}
          <ChevronDown size={12} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-[14px] border border-border bg-card shadow-lg overflow-hidden z-50">
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-foreground hover:bg-secondary transition-colors no-underline"
            >
              <User size={14} />
              Hesabım
            </Link>
            <div className="border-t border-border" />
            <button
              onClick={async () => { setOpen(false); await logout(); router.replace("/"); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} />
              Çıkış Yap
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-[15px] font-medium text-foreground/80 hover:text-foreground transition-colors"
      >
        Giriş Yap
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-[14px] border border-border bg-card shadow-lg overflow-hidden z-50">
          <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Giriş türü seçin
          </p>
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] text-foreground hover:bg-secondary transition-colors no-underline"
          >
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <User size={15} />
            </div>
            <div>
              <p className="font-medium leading-tight">Müşteri Girişi</p>
              <p className="text-[11px] text-muted-foreground">Randevular, favoriler</p>
            </div>
          </Link>
          <Link
            href="/business/login"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-[13px] text-foreground hover:bg-secondary transition-colors no-underline"
          >
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <Building2 size={15} className="text-background" />
            </div>
            <div>
              <p className="font-medium leading-tight">İşletme Girişi</p>
              <p className="text-[11px] text-muted-foreground">Yönetim paneli</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
