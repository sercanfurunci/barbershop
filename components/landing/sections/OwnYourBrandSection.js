"use client";

import FadeUp from "@/components/landing/shared/FadeUp";
import SectionHead from "@/components/landing/shared/SectionHead";
import Eyebrow from "@/components/shared/Eyebrow";

export default function OwnYourBrandSection() {
  return (
    <section style={{ background: "var(--color-secondary, #f4f4f4)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Marka sahipliği"
          title={<>Müşterin senin.<br />Pazaryeri arada yok.</>}
          sub="Instagram'da paylaşılan link senin salonunu açar — rakip listesi değil."
        />
        <div className="mt-14 grid md:grid-cols-2 gap-5">
          <FadeUp>
            <div className="rounded-[20px] border border-border bg-card p-7">
              <Eyebrow className="mb-4 block">Pazaryeri platformları</Eyebrow>
              <div className="mb-5 rounded-xl bg-secondary px-3 py-2.5 text-xs text-muted-foreground break-all font-mono-custom">
                platform.com/s/DsJTCVXovTS21DUFJ…
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {["Müşteri senin değil, platformun markasını hatırlar", "Aynı sayfada rakip salonlar bir tık ötede", "Müşteri verisi platformun veritabanında"].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm text-secondary-foreground leading-relaxed">
                    <span className="shrink-0 text-muted-foreground">—</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="rounded-[20px] bg-foreground text-background p-7" style={{ boxShadow: "var(--shadow-pop)" }}>
              <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-background/70 font-mono-custom">MAKAS ile</div>
              <div className="mb-5 rounded-xl bg-white/10 px-3 py-2.5 text-[13px] font-semibold text-background break-all font-mono-custom">
                senin-salonun.com
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {["Müşteri salonu — yani seni hatırlar", "Sayfanda rakip yok, sadece sen varsın", "Tüm müşteri verisi tamamen senin"].map((t) => (
                  <li key={t} className="flex gap-2.5 text-sm text-background/90 leading-relaxed">
                    <span className="shrink-0">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
