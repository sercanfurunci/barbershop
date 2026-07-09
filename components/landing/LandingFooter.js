import Link from "next/link";

function MakasMark({ variant = "light", className }) {
  const src = variant === "dark" ? "/logo-dark.svg" : "/logo-light.svg";
  return <img src={src} alt="MAKAS" className={className} style={{ display: "block" }} />;
}

const NAV = [
  { label: "Özellikler", href: "/#explore" },
  { label: "Fiyat",      href: "/#pricing" },
  { label: "Demo",       href: "/#demo" },
  { label: "SSS",        href: "/#faq" },
  { label: "İletişim",   href: "/#contact" },
];

export default function LandingFooter() {
  return (
    <footer className="bg-foreground px-6 pt-14 pb-8 text-background">
      <div
        className="mx-auto mb-10 grid max-w-[1200px] gap-8"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
      >
        <div className="lg:col-span-2">
          <Link href="/" className="mb-3 flex items-center gap-3.5 no-underline">
            <MakasMark variant="light" className="block h-10 w-10" />
            <span className="font-display text-[22px] font-extrabold leading-none tracking-[-0.02em]">
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
            <Link
              key={href}
              href={href}
              className="mb-1 block py-0.5 text-sm text-background/70 no-underline hover:text-background"
            >
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
          <a
            href="mailto:sercanfurunci41@gmail.com"
            className="mb-1.5 block text-sm text-background/70 no-underline hover:text-background"
          >
            sercanfurunci41@gmail.com
          </a>
        </div>
      </div>

      <div className="border-t border-background/10 pt-6 max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-3 text-[13px] text-background/40">
        <span>© 2026 MAKAS. Tüm hakları saklıdır.</span>
        <div className="flex items-center gap-4">
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
