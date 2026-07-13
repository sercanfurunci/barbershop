"use client";

import { Star } from "lucide-react";

export default function StatsSection() {
  return (
    <section className="border-y border-border" style={{ background: "var(--makas-bg)" }}>
      <div className="mx-auto max-w-[1200px] px-6 py-10 md:py-12">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <h3
            className="font-display text-foreground"
            style={{ fontSize: "clamp(20px, 2.4vw, 30px)", lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.5px" }}
          >
            Türkiye'nin dört bir yanından berber ve kuaförler MAKAS'ı tercih ediyor.
          </h3>
          <div className="flex flex-wrap items-center gap-6 md:gap-8">
            {[
              { value: "4.9/5", label: "salon memnuniyeti", icon: <Star size={14} fill="currentColor" className="text-foreground" /> },
              { value: "%99.9", label: "çalışma süresi" },
              { value: "1 gün", label: "kurulum" },
            ].map(({ value, label, icon }, i) => (
              <div key={label}>
                {i > 0 && <div className="hidden sm:block absolute h-5 w-px bg-border" style={{ marginLeft: "-24px" }} />}
                <div className="flex items-center gap-2">
                  {icon && <div className="flex">{[...Array(5)].map((_, j) => <Star key={j} size={13} fill="currentColor" className="text-foreground" />)}</div>}
                  <span className="font-semibold text-foreground text-sm">{value}</span>
                  <span className="text-muted-foreground text-sm">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
