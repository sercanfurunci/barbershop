"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, ExternalLink } from "lucide-react";

import FadeUp from "@/components/landing/shared/FadeUp";
import SectionHead from "@/components/landing/shared/SectionHead";

const TESTIMONIALS = [
  {
    quote: "Telefonla randevu trafiği yüzde 60 azaldı. Müşteriler kendi randevusunu alıyor, biz de işimize odaklanıyoruz.",
    name: "Abdurrahman Çelik",
    role: "Exclusive Salon — Darıca",
    link: "/abdurrahman",
  },
  {
    quote: "Eski sistemden geçiş 1 günde tamamlandı. Berberlerimin hepsi ilk hafta içinde rahatça kullanmaya başladı.",
    name: "Makas Demo Salon",
    role: "Örnek salon — Online inceleyin",
    link: "/demo",
  },
];

export default function TestimonialSection() {
  return (
    <section className="theme-invert bg-foreground text-background relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 80% at 20% 30%, rgba(245,241,235,0.06) 0%, transparent 60%)" }}
      />
      <div
        className="relative mx-auto max-w-[1100px] px-6"
        style={{ paddingTop: "clamp(80px, 11vw, 128px)", paddingBottom: "clamp(80px, 11vw, 128px)" }}
      >
        <SectionHead eyebrow="Müşteri hikayeleri" title="Gerçek salonlar, gerçek sonuçlar." light />

        <div className="mt-14 grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {TESTIMONIALS.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-7 flex flex-col h-full">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" className="text-amber-300" />)}
                </div>
                <p className="font-display text-background leading-snug flex-1" style={{ fontSize: "clamp(17px, 1.7vw, 21px)", letterSpacing: "-0.3px" }}>
                  "{t.quote}"
                </p>
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-background">{t.name}</p>
                    <p className="text-[12px] text-background/60">{t.role}</p>
                  </div>
                  <Link href={t.link} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-background/80 hover:text-background no-underline">
                    Ziyaret et <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
