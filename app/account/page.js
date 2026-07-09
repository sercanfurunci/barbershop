"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors, Calendar, Clock, Heart, User, Settings, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
  { id: "upcoming",  label: "Yaklaşan",  Icon: Calendar },
  { id: "history",   label: "Geçmiş",    Icon: Clock },
  { id: "favorites", label: "Favoriler", Icon: Heart },
  { id: "profile",   label: "Profil",    Icon: User },
  { id: "settings",  label: "Ayarlar",   Icon: Settings },
];

export default function AccountPage() {
  const { user, loaded, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    if (!loaded) return;
    if (!user) { router.replace("/login?redirect=/account"); return; }
    if (user.role !== "CUSTOMER") { router.replace("/admin"); }
  }, [loaded, user, router]);

  if (!loaded || !user) return null;

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-[1100px] flex items-center justify-between px-5 h-16">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Scissors size={18} className="text-foreground" />
            <span className="font-display font-extrabold text-[18px] tracking-[-0.02em] text-foreground">MAKAS</span>
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={14} />
            Çıkış
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 sm:px-6 py-8">
        {/* User greeting */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-[28px] tracking-tight text-foreground">
            Merhaba, {user.displayName?.split(" ")[0] || "Misafir"} 👋
          </h1>
          <p className="mt-1 text-[14px] text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex gap-8 flex-col md:flex-row">
          {/* Sidebar tabs (desktop) / horizontal scroll (mobile) */}
          <nav className="md:w-52 shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0" style={{ scrollbarWidth: "none" }}>
              {TABS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`shrink-0 md:w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors text-left ${
                    tab === id
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === "upcoming" && <AppointmentsTab type="upcoming" />}
            {tab === "history"  && <AppointmentsTab type="history" />}
            {tab === "favorites" && <FavoritesTab />}
            {tab === "profile"  && <ProfileTab user={user} />}
            {tab === "settings" && <SettingsTab onLogout={handleLogout} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Placeholder content panels ────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted-foreground/40" />
      </div>
      <p className="font-semibold text-[16px] text-foreground">{title}</p>
      {sub && <p className="mt-2 text-[13px] text-muted-foreground max-w-[280px]">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function AppointmentsTab({ type }) {
  return (
    <EmptyState
      icon={Calendar}
      title={type === "upcoming" ? "Yaklaşan randevunuz yok" : "Geçmiş randevu yok"}
      sub={type === "upcoming" ? "Salonları keşfedip randevu alabilirsiniz." : "Daha önce randevu almadınız."}
      action={
        type === "upcoming"
          ? <Link href="/salons" className="rounded-full bg-foreground text-background text-[13px] font-semibold px-5 py-2.5 hover:bg-foreground/90 transition-colors no-underline">Salon Bul</Link>
          : null
      }
    />
  );
}

function FavoritesTab() {
  return (
    <EmptyState
      icon={Heart}
      title="Favori salonunuz yok"
      sub="Beğendiğiniz salonları favorilere ekleyin."
      action={<Link href="/salons" className="rounded-full bg-foreground text-background text-[13px] font-semibold px-5 py-2.5 hover:bg-foreground/90 transition-colors no-underline">Keşfet</Link>}
    />
  );
}

function ProfileTab({ user }) {
  return (
    <div className="space-y-4 max-w-[480px]">
      <h2 className="font-semibold text-[18px] text-foreground">Profil Bilgileri</h2>
      {[
        { label: "Ad Soyad",  value: user.displayName || "—" },
        { label: "E-posta",   value: user.email },
        { label: "Telefon",   value: user.phone || "—" },
      ].map(({ label, value }) => (
        <div key={label} className="flex items-center justify-between rounded-[12px] border border-border bg-card px-4 py-3.5">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-[14px] text-foreground mt-0.5">{value}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground/40" />
        </div>
      ))}
      <p className="text-[12px] text-muted-foreground">Profil düzenleme yakında kullanıma açılacak.</p>
    </div>
  );
}

function SettingsTab({ onLogout }) {
  return (
    <div className="space-y-3 max-w-[480px]">
      <h2 className="font-semibold text-[18px] text-foreground">Ayarlar</h2>
      <div className="rounded-[12px] border border-border overflow-hidden">
        {["Bildirimler", "Gizlilik", "Dil"].map((item, i, arr) => (
          <div key={item} className={`flex items-center justify-between px-4 py-3.5 hover:bg-secondary transition-colors cursor-pointer ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
            <span className="text-[14px] text-foreground">{item}</span>
            <ChevronRight size={16} className="text-muted-foreground/40" />
          </div>
        ))}
      </div>
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-[12px] border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
      >
        <span className="text-[14px] font-medium">Çıkış Yap</span>
        <LogOut size={15} />
      </button>
    </div>
  );
}
