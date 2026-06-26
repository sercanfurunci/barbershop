import Link from "next/link";
import PillButton from "@/components/shared/PillButton";

function MakasMark({ variant = "dark", className }) {
  const src = variant === "dark" ? "/logo-dark.svg" : "/logo-light.svg";
  return <img src={src} alt="MAKAS" className={className} style={{ display: "block" }} />;
}

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
      <nav className="mx-auto flex h-[68px] md:h-[76px] max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3.5 md:gap-4 no-underline">
          <MakasMark variant="dark" className="block h-9 w-9 md:h-11 md:w-11" />
          <span className="font-display text-[22px] md:text-[26px] font-extrabold leading-none tracking-[-0.02em] text-foreground">
            MAKAS
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
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
          <PillButton variant="ghost" size="sm" href="/#demo" className="hidden sm:inline-flex">
            Demo Gör
          </PillButton>
          <PillButton variant="primary" size="sm" href="/#contact">
            Hemen Başla
          </PillButton>
        </div>
      </nav>
    </header>
  );
}
