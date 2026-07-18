"use client";

import SectionHead from "@/components/landing/shared/SectionHead";

export default function WhyDifferentSection() {
  return (
    <section
      style={{ background: "var(--makas-bg)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[820px]">
        <SectionHead
          eyebrow="Neden MAKAS"
          title={<>Berber yazılımı,<br />nihayet doğru yapıldı.</>}
          sub="Yabancı platformlarda Türkçe çeviri gibi durmayan, telefonda da masaüstünde de doğru çalışan, berberin kendi diliyle konuşan bir sistem. Karmaşa yok, kurulum hediye, sözleşme yok."
        />
      </div>
    </section>
  );
}
