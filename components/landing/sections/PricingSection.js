"use client";

import { CheckCircle } from "lucide-react";

import FadeUp from "@/components/landing/shared/FadeUp";
import SectionHead from "@/components/landing/shared/SectionHead";
import Eyebrow from "@/components/shared/Eyebrow";
import PillButton from "@/components/shared/PillButton";
import { PLAN_FEATURES, ADDONS } from "@/components/landing/data/landingData";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function PricingSection() {
  return (
    <section id="pricing" style={{ background: "var(--makas-bg)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1100px]">
        <SectionHead eyebrow="Fiyatlandırma" title="Tek plan, net fiyat." sub="Karmaşık paket yok, gizli ücret yok. Sınırsız her şey." />
        <div className="mt-12 grid lg:grid-cols-[1fr_1.1fr] gap-6 items-stretch">
          <FadeUp>
            <div className="rounded-[24px] bg-foreground p-9 text-background flex flex-col h-full" style={{ boxShadow: "var(--shadow-pop)" }}>
              <Eyebrow className="text-background/60 mb-3 block">Standart Plan</Eyebrow>
              <div className="flex flex-wrap items-baseline gap-2 mb-6">
                <span className="text-[56px] font-display font-bold leading-none tracking-[-1.5px]">₺500</span>
                <span className="text-base opacity-75">/ ay</span>
              </div>
              <ul className="m-0 flex list-none flex-col gap-3 p-0 mb-7 flex-1">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14.5px]">
                    <CheckCircle size={16} strokeWidth={2.2} className="shrink-0 mt-0.5 opacity-90" />
                    {f}
                  </li>
                ))}
              </ul>
              <PillButton variant="secondary" size="lg" onClick={() => scrollTo("contact")} className="w-full">
                14 Gün Ücretsiz Dene
              </PillButton>
            </div>
          </FadeUp>
          <FadeUp delay={0.08}>
            <div className="rounded-[24px] border border-border bg-card p-9 flex flex-col h-full">
              <Eyebrow className="mb-4 block">Ek hizmetler</Eyebrow>
              <h3 className="font-display text-2xl font-bold text-foreground tracking-[-0.5px] mb-6">İhtiyacın olduğunda ekle.</h3>
              <ul className="m-0 flex list-none flex-col gap-5 p-0 flex-1">
                {ADDONS.map((a) => (
                  <li key={a.name} className="flex flex-col gap-1 pb-4 border-b border-border last:border-0 last:pb-0">
                    <span className="text-[15px] font-semibold text-foreground">{a.name}</span>
                    <span className="text-[13.5px] text-muted-foreground leading-relaxed">{a.detail}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[12.5px] text-muted-foreground">Kurulum ücretsiz, istediğin zaman iptal et. KDV hariç.</p>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
