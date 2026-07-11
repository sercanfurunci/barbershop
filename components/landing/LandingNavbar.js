import Link from "next/link";
import PillButton from "@/components/shared/PillButton";
import AuthNav from "@/components/landing/AuthNav";
import DemoButton from "@/components/landing/DemoButton";
import MobileNav from "@/components/landing/MobileNav";
import { BrandMark } from "@/components/ds";

export default function LandingNavbar() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "color-mix(in oklab, var(--makas-bg) 88%, transparent)",
      }}
    >
      <nav className="mx-auto flex h-[68px] max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3.5 no-underline">
          <BrandMark variant="dark" size={40} />
          <span className="font-display text-[24px] font-extrabold leading-none tracking-[-0.02em] text-foreground">
            MAKAS
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/salons"
            className="px-4 py-2 text-[15px] font-medium text-foreground/80 hover:text-foreground no-underline"
          >
            Salonları Keşfet
          </Link>
          <Link
            href="/#explore"
            className="px-4 py-2 text-[15px] font-medium text-foreground/80 hover:text-foreground no-underline"
          >
            Özellikler
          </Link>
          <Link
            href="/#pricing"
            className="px-4 py-2 text-[15px] font-medium text-foreground/80 hover:text-foreground no-underline"
          >
            Fiyat
          </Link>
          <Link
            href="/#demo"
            className="px-4 py-2 text-[15px] font-medium text-foreground/80 hover:text-foreground no-underline"
          >
            Demo
          </Link>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Auth-aware dropdown: Giriş Yap / Hesabım / Dashboard */}
          <AuthNav />

          {/* Demo auto-login button */}
          <DemoButton className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-transparent text-foreground/80 hover:text-foreground hover:bg-secondary font-medium text-sm h-[var(--pill-h-sm)] px-5 transition-colors duration-200 disabled:opacity-50">
            Demo Gör
          </DemoButton>

          <PillButton variant="primary" size="sm" href="/#contact" className="hidden sm:inline-flex">
            Hemen Başla
          </PillButton>

          {/* Mobile-only: profile + hamburger (bottom sheets) */}
          <MobileNav />
        </div>
      </nav>
    </header>
  );
}
