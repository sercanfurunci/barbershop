"use client";

import { useEffect } from "react";
import Logo from "@/components/common/Logo";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("[App error]", error?.message);
  }, [error]);

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--makas-bg)" }}
    >
      <div className="mb-8">
        <Logo variant="dark" size={40} />
      </div>

      <p
        className="font-mono-custom mb-3"
        style={{ fontSize: "11px", letterSpacing: "0.2em", color: "var(--makas-ink-muted)", textTransform: "uppercase" }}
      >
        Hata
      </p>

      <h1
        className="font-display font-light"
        style={{ fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-0.02em", color: "var(--makas-ink)", marginBottom: "12px" }}
      >
        Bir şeyler ters gitti
      </h1>

      <p style={{ fontSize: "15px", color: "var(--makas-ink-secondary)", maxWidth: "300px", lineHeight: 1.6, marginBottom: "40px" }}>
        Sayfayı yenilemek sorunu çözebilir. Sorun devam ederse lütfen tekrar deneyin.
      </p>

      <button
        onClick={reset}
        className="inline-flex h-11 items-center px-6 rounded-full text-[14px] font-semibold transition-opacity hover:opacity-90"
        style={{ background: "var(--makas-ink)", color: "#fff" }}
      >
        Sayfayı Yenile
      </button>
    </div>
  );
}
