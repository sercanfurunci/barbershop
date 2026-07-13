export default function Loading() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-6"
      style={{ background: "var(--makas-bg)" }}
    >
      {/* Animated scissors mark from brand logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-dark.svg"
        alt="MAKAS"
        width={40}
        height={40}
        className="opacity-20"
        style={{ animation: "hero-fade-in 0.6s ease both" }}
      />
      <div
        className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--makas-border)", borderTopColor: "var(--makas-ink)" }}
      />
    </div>
  );
}
