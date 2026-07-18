import Link from "next/link";
import Logo from "@/components/common/Logo";

export const metadata = {
  title: "Sayfa Bulunamadı — MAKAS",
};

export default function NotFound() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--makas-bg)" }}
    >
      <div className="mb-8">
        <Logo href="/" variant="dark" size={40} />
      </div>

      <p
        className="font-mono-custom mb-3"
        style={{ fontSize: "11px", letterSpacing: "0.2em", color: "var(--makas-ink-muted)", textTransform: "uppercase" }}
      >
        404
      </p>

      <h1
        className="font-display font-light"
        style={{ fontSize: "clamp(32px, 6vw, 52px)", letterSpacing: "-0.02em", color: "var(--makas-ink)", marginBottom: "12px" }}
      >
        Sayfa bulunamadı
      </h1>

      <p style={{ fontSize: "15px", color: "var(--makas-ink-secondary)", maxWidth: "320px", lineHeight: 1.6, marginBottom: "40px" }}>
        Aradığınız sayfa kaldırılmış veya taşınmış olabilir.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center px-6 rounded-full text-[14px] font-semibold no-underline transition-opacity hover:opacity-90"
          style={{ background: "var(--makas-ink)", color: "var(--makas-bg)" }}
        >
          Ana Sayfaya Dön
        </Link>
        <Link
          href="/salons"
          className="inline-flex h-11 items-center px-6 rounded-full text-[14px] font-medium no-underline border transition-colors"
          style={{ borderColor: "var(--makas-border)", color: "var(--makas-ink-secondary)" }}
        >
          Salonları Keşfet
        </Link>
      </div>
    </div>
  );
}
