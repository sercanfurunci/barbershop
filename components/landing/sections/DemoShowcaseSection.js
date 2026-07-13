"use client";

import Link from "next/link";
import { Scissors, ArrowRight } from "lucide-react";

import FadeUp from "@/components/landing/shared/FadeUp";
import SectionHead from "@/components/landing/shared/SectionHead";
import { DEMOS } from "@/components/landing/data/landingData";

export default function DemoShowcaseSection() {
  return (
    <section id="demo" style={{ background: "white", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1100px]">
        <SectionHead
          eyebrow="Canlı örnekler"
          title="Gerçek bir randevu deneyimi."
          sub="MAKAS üzerinde çalışan salonları kendi telefonunuzdan inceleyin."
        />
        <div className="mx-auto mt-12 grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", maxWidth: 800 }}>
          {DEMOS.map(({ name, slug, tag }, i) => (
            <FadeUp key={slug} delay={i * 0.1}>
              <Link
                href={`/${slug}`}
                className="group block rounded-[20px] border border-border bg-card p-7 no-underline transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
                  <Scissors size={18} className="text-foreground" />
                </div>
                <p className="mb-1.5 text-base font-bold text-foreground">{name}</p>
                <p className="mb-5 text-[13px] text-muted-foreground">{tag}</p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                  Ziyaret Et <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
