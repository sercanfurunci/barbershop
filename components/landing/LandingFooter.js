import Link from "next/link";
import { BrandMark } from "@/components/ds";

const NAV = [
  { label: "Özellikler", href: "/#explore" },
  { label: "Fiyat",      href: "/#pricing" },
  { label: "Demo",       href: "/#demo" },
  { label: "SSS",        href: "/#faq" },
  { label: "İletişim",   href: "/#contact" },
];

export default function LandingFooter() {
  return (
    <footer className="bg-foreground text-background px-6 pt-8 pb-5 md:pt-14 md:pb-8">
      {/* ── Desktop grid (unchanged) ── */}
      <div
        className="hidden md:grid mx-auto mb-10 max-w-[1200px] gap-8"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
      >
        <div className="lg:col-span-2">
          <Link href="/" className="mb-3 flex items-center gap-3.5 no-underline">
            <BrandMark variant="light" size={40} />
            <span className="font-display text-[24px] font-extrabold leading-none tracking-[-0.02em]">
              MAKAS
            </span>
          </Link>
          <p className="text-[14px] leading-relaxed text-background/60 max-w-xs">
            Türkiye'nin berber ve kuaförleri için premium randevu ve yönetim platformu.
          </p>
        </div>

        <div>
          <p className="mb-3.5 text-[12px] font-bold uppercase tracking-[0.1em] text-background/50 font-mono-custom">
            Gezinti
          </p>
          {NAV.map(({ label, href }) => (
            <Link key={href} href={href} className="mb-1 block py-0.5 text-sm text-background/70 no-underline hover:text-background">
              {label}
            </Link>
          ))}
        </div>

        <div>
          <p className="mb-3.5 text-[12px] font-bold uppercase tracking-[0.1em] text-background/50 font-mono-custom">
            Müşteriler
          </p>
          <Link href="/salons" className="mb-1 block py-0.5 text-sm text-background/70 no-underline hover:text-background">
            Salonları Keşfet
          </Link>
          <Link href="/salons?sort=rating" className="mb-1 block py-0.5 text-sm text-background/70 no-underline hover:text-background">
            En İyi Salonlar
          </Link>
          <Link href="/salons?sort=newest" className="mb-1 block py-0.5 text-sm text-background/70 no-underline hover:text-background">
            Yeni Salonlar
          </Link>
        </div>

        <div>
          <p className="mb-3.5 text-[12px] font-bold uppercase tracking-[0.1em] text-background/50 font-mono-custom">
            İletişim
          </p>
          <a href="mailto:sercanfurunci41@gmail.com" className="mb-1.5 block text-sm text-background/70 no-underline hover:text-background">
            sercanfurunci41@gmail.com
          </a>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="md:hidden mx-auto max-w-[1200px] mb-6">
        {/* Brand */}
        <div className="mb-5">
          <Link href="/" className="mb-2 flex items-center gap-3 no-underline">
            <BrandMark variant="light" size={34} />
            <span className="font-display text-[20px] font-extrabold leading-none tracking-[-0.02em]">
              MAKAS
            </span>
          </Link>
          <p className="text-[13px] leading-relaxed text-background/60">
            Türkiye'nin berber ve kuaförleri için premium randevu ve yönetim platformu.
          </p>
        </div>

        {/* Gezinti + Müşteriler side-by-side */}
        <div className="grid grid-cols-2 gap-x-4 mb-5">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-background/50 font-mono-custom">
              Gezinti
            </p>
            {NAV.map(({ label, href }) => (
              <Link key={href} href={href} className="mb-0.5 block py-0.5 text-[13px] text-background/70 no-underline hover:text-background">
                {label}
              </Link>
            ))}
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-background/50 font-mono-custom">
              Müşteriler
            </p>
            <Link href="/salons" className="mb-0.5 block py-0.5 text-[13px] text-background/70 no-underline hover:text-background">
              Salonları Keşfet
            </Link>
            <Link href="/salons?sort=rating" className="mb-0.5 block py-0.5 text-[13px] text-background/70 no-underline hover:text-background">
              En İyi Salonlar
            </Link>
            <Link href="/salons?sort=newest" className="mb-0.5 block py-0.5 text-[13px] text-background/70 no-underline hover:text-background">
              Yeni Salonlar
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-background/50 font-mono-custom">
            İletişim
          </p>
          <a href="mailto:sercanfurunci41@gmail.com" className="text-[13px] text-background/70 no-underline hover:text-background">
            sercanfurunci41@gmail.com
          </a>
        </div>
      </div>

      {/* Copyright (shared) */}
      <div className="border-t border-background/10 pt-4 md:pt-6 max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-2 md:gap-3 text-[12px] md:text-[13px] text-background/40">
        <span>© 2026 MAKAS. Tüm hakları saklıdır.</span>
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/gizlilik" className="text-inherit no-underline opacity-70 hover:opacity-100">
            Gizlilik
          </Link>
          <Link href="/kullanim-kosullari" className="text-inherit no-underline opacity-70 hover:opacity-100">
            Kullanım Koşulları
          </Link>
          <Link href="/cerez-politikasi" className="text-inherit no-underline opacity-70 hover:opacity-100">
            Çerezler
          </Link>
        </div>
      </div>
    </footer>
  );
}
