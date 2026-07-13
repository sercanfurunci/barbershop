"use client";

import {
  Calendar,
  Bell,
  Heart,
  Star,
  Scissors,
  Smartphone,
} from "lucide-react";

import FadeUp from "@/components/landing/shared/FadeUp";
import SectionHead from "@/components/landing/shared/SectionHead";

const APP_FEATURES = [
  { icon: <Calendar size={18} />, title: "Randevu Al", desc: "Salonunu seç, berberi belirle, saati bul." },
  { icon: <Bell size={18} />,     title: "Hatırlatmalar", desc: "Randevundan önce otomatik bildirim." },
  { icon: <Heart size={18} />,    title: "Favoriler", desc: "Beğendiğin salonları kaydet, hızla eriş." },
  { icon: <Star size={18} />,     title: "Değerlendirme", desc: "Randevu sonrası salon ve berber puanla." },
];

export default function MobileAppSection() {
  return (
    <section style={{ background: "white", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHead
              eyebrow="Mobil Uygulama"
              title={<>Salonun her zaman<br />cebinde.</>}
              sub="iOS ve Android için optimize edilmiş uygulamamızla randevularını yönet, salonları keşfet."
              align="left"
              maxWidth={560}
            />
            <div className="mt-10 grid grid-cols-2 gap-4">
              {APP_FEATURES.map(({ icon, title, desc }, i) => (
                <FadeUp key={title} delay={i * 0.07}>
                  <div className="rounded-[16px] border border-border bg-card p-5">
                    <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center text-foreground mb-3">
                      {icon}
                    </div>
                    <p className="font-semibold text-foreground text-[14px] mb-1">{title}</p>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
            <FadeUp delay={0.3} className="mt-8 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-[12px] bg-foreground text-background px-5 py-3 text-[14px] font-semibold">
                <Smartphone size={16} />
                App Store'da İndir
              </div>
              <div className="inline-flex items-center gap-2 rounded-[12px] border border-border bg-card px-5 py-3 text-[14px] font-semibold text-foreground">
                <Smartphone size={16} />
                Google Play'de İndir
              </div>
            </FadeUp>
          </div>

          {/* Phone mockup */}
          <FadeUp delay={0.15} className="relative hidden lg:flex justify-center">
            <div
              className="relative rounded-[40px] bg-foreground p-4 w-[280px]"
              style={{ boxShadow: "var(--shadow-elevated)", aspectRatio: "9/19" }}
            >
              <div className="rounded-[28px] bg-card h-full overflow-hidden relative">
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-foreground z-10" />
                <div className="pt-12 px-4 pb-4 h-full flex flex-col gap-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Yakın Salonlar</p>
                  {[
                    { name: "Elite Barber", city: "Kadıköy", rating: "4.9" },
                    { name: "Royal Kuaför", city: "Beşiktaş", rating: "4.7" },
                  ].map((s) => (
                    <div key={s.name} className="rounded-[14px] border border-border bg-background p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Scissors size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">{s.city}</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Star size={10} fill="#F59E0B" className="text-amber-500" />
                        <span className="text-[11px] font-semibold text-foreground">{s.rating}</span>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-[14px] bg-foreground p-3 flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-background">Randevunu al →</p>
                    <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
                      <Calendar size={12} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
