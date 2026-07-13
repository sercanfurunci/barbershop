"use client";

import {
  Calendar,
  CreditCard,
  Users,
  Megaphone,
  Settings,
  CheckCircle,
} from "lucide-react";

import FadeUp from "@/components/landing/shared/FadeUp";
import SectionHead from "@/components/landing/shared/SectionHead";
import Eyebrow from "@/components/shared/Eyebrow";
import { FEATURED_FEATURE, SUPPORTING_FEATURES } from "@/components/landing/data/landingData";

const ICON_MAP = { CreditCard, Users, Megaphone, Settings };

function FeaturedFeatureCard() {
  return (
    <FadeUp className="md:col-span-2">
      <div
        className="rounded-[24px] bg-card border border-border p-8 lg:p-10 flex flex-col lg:flex-row gap-8 lg:gap-10 relative overflow-hidden h-full"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(17,17,17,0.04) 0%, transparent 70%)" }} />
        <div className="relative flex-1 min-w-0 flex flex-col">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <Calendar size={22} strokeWidth={1.8} />
          </div>
          <Eyebrow className="mb-3 block">{FEATURED_FEATURE.eyebrow}</Eyebrow>
          <h3 className="font-display font-bold text-foreground leading-[1.1] mb-4" style={{ fontSize: "clamp(22px, 2.2vw, 30px)", letterSpacing: "-0.7px" }}>
            {FEATURED_FEATURE.title}
          </h3>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-6 max-w-md">{FEATURED_FEATURE.desc}</p>
          <ul className="m-0 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 list-none p-0 mt-auto">
            {FEATURED_FEATURE.items.map((it) => (
              <li key={it} className="flex items-start gap-2.5 text-[14px] text-secondary-foreground">
                <CheckCircle size={15} strokeWidth={2.2} className="shrink-0 mt-0.5 text-foreground" />
                {it}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative lg:w-[260px] shrink-0">
          <div className="rounded-2xl bg-background border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <Eyebrow>Bugün · Salı</Eyebrow>
              <span className="text-[11px] font-mono-custom text-muted-foreground">9 randevu</span>
            </div>
            <div className="space-y-1.5">
              {[
                { t: "09:00", n: "Ahmet Y.",  c: "border-emerald-300 bg-emerald-50" },
                { t: "09:45", n: "—",         c: "border-dashed border-border bg-transparent", empty: true },
                { t: "10:30", n: "Mehmet K.", c: "border-sky-300 bg-sky-50" },
                { t: "11:15", n: "Burak D.",  c: "border-amber-300 bg-amber-50" },
              ].map((r) => (
                <div key={r.t} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${r.c}`}>
                  <span className="text-[10.5px] font-mono-custom text-muted-foreground w-9 shrink-0">{r.t}</span>
                  <span className={`text-[12px] font-medium truncate ${r.empty ? "text-muted-foreground italic" : "text-foreground"}`}>{r.empty ? "Boş slot" : r.n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </FadeUp>
  );
}

function SupportingFeatureCard({ data, delay = 0 }) {
  const { eyebrow, title, desc, iconName, items } = data;
  const Icon = ICON_MAP[iconName];
  return (
    <FadeUp delay={delay} className="h-full">
      <div className="rounded-[24px] bg-card border border-border p-7 flex flex-col h-full hover:shadow-[var(--shadow-card)] transition-shadow">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-foreground">
          {Icon && <Icon size={20} strokeWidth={1.8} />}
        </div>
        <Eyebrow className="mb-2 block">{eyebrow}</Eyebrow>
        <h3 className="font-display text-[19px] font-bold text-foreground tracking-[-0.4px] leading-[1.2] mb-3">{title}</h3>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-5">{desc}</p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 mt-auto pt-3 border-t border-border">
          {items.map((it) => (
            <li key={it} className="flex items-center gap-2.5 text-[13px] text-secondary-foreground pt-1">
              <span className="h-1 w-1 rounded-full bg-foreground/40 shrink-0" />
              {it}
            </li>
          ))}
        </ul>
      </div>
    </FadeUp>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="explore"
      style={{ background: "var(--color-secondary, #f4f4f4)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <SectionHead
          eyebrow="Platform"
          title="Salon yönetiminin tamamı, tek panelde."
          sub="Randevu defteri, kasa programı, müşteri yönetimi ve hatırlatma sistemini ayrı ayrı kullanmaya son."
        />
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
          <FeaturedFeatureCard />
          <SupportingFeatureCard data={SUPPORTING_FEATURES[0]} delay={0.08} />
          {SUPPORTING_FEATURES.slice(1).map((c, i) => (
            <SupportingFeatureCard key={c.eyebrow} data={c} delay={(i + 2) * 0.06} />
          ))}
        </div>
      </div>
    </section>
  );
}
