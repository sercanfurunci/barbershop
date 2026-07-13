"use client";

import Link from "next/link";
import {
  Calendar,
  Search,
  BarChart2,
  MessageCircle,
  Bell,
  Heart,
  Star,
  ArrowRight,
  Users,
  Smartphone,
  MapPin,
} from "lucide-react";

import FadeUp from "@/components/landing/shared/FadeUp";
import Eyebrow from "@/components/shared/Eyebrow";

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function PlatformSection() {
  return (
    <section
      className="bg-foreground text-background"
      style={{ padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}
    >
      <div className="mx-auto max-w-[1200px]">
        <FadeUp className="text-center mx-auto mb-14" style={{ maxWidth: 640 }}>
          <Eyebrow className="text-white/60 mb-4">Herkes için MAKAS</Eyebrow>
          <h2
            className="font-display font-bold text-white leading-[1.05]"
            style={{ fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-1.5px" }}
          >
            Hem müşteriler,<br />hem salon sahipleri için.
          </h2>
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Customers */}
          <FadeUp delay={0.05}>
            <div className="rounded-[24px] bg-white/[0.07] border border-white/10 p-8 h-full">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Search size={22} className="text-white" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-3">Müşteriler</p>
              <h3
                className="font-display font-bold text-white leading-snug mb-4"
                style={{ fontSize: "clamp(20px, 2.2vw, 26px)", letterSpacing: "-0.5px" }}
              >
                Yakınındaki en iyi salonu bul
              </h3>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: <MapPin size={15} />, text: "Şehir ve ilçeye göre salon keşfet" },
                  { icon: <Star size={15} />,   text: "Puanlara ve yorumlara göre seç" },
                  { icon: <Calendar size={15} />, text: "7/24 online randevu al" },
                  { icon: <Bell size={15} />,   text: "Hatırlatma bildirimleri" },
                  { icon: <Heart size={15} />,  text: "Favori salonlarını kaydet" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-[14px] text-white/80">
                    <span className="text-white/50">{icon}</span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                href="/salons"
                className="inline-flex items-center gap-2 rounded-[12px] bg-white text-foreground px-5 py-3 text-[14px] font-semibold no-underline hover:bg-white/90 transition-colors"
              >
                Salon Bul <ArrowRight size={14} />
              </Link>
            </div>
          </FadeUp>

          {/* Business owners */}
          <FadeUp delay={0.1}>
            <div className="rounded-[24px] bg-white/[0.07] border border-white/10 p-8 h-full">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <BarChart2 size={22} className="text-white" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 mb-3">Salon Sahipleri</p>
              <h3
                className="font-display font-bold text-white leading-snug mb-4"
                style={{ fontSize: "clamp(20px, 2.2vw, 26px)", letterSpacing: "-0.5px" }}
              >
                Salonunuzu büyüten her şey
              </h3>
              <ul className="space-y-3 mb-8">
                {[
                  { icon: <Calendar size={15} />,  text: "Akıllı randevu ve takvim yönetimi" },
                  { icon: <Users size={15} />,     text: "Çoklu berber ve personel yönetimi" },
                  { icon: <BarChart2 size={15} />, text: "Gelir raporları ve analizler" },
                  { icon: <MessageCircle size={15} />, text: "WhatsApp ve SMS hatırlatma" },
                  { icon: <Smartphone size={15} />, text: "Mobil uygulama (iOS + Android)" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-[14px] text-white/80">
                    <span className="text-white/50">{icon}</span>
                    {text}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => scrollTo("contact")}
                className="inline-flex items-center gap-2 rounded-[12px] bg-white text-foreground px-5 py-3 text-[14px] font-semibold cursor-pointer border-0 hover:bg-white/90 transition-colors"
              >
                Salonunuzu Ekleyin <ArrowRight size={14} />
              </button>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
