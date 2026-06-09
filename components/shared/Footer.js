"use client";

import Link from "next/link";
import { Share2, Link2, Globe, MapPin, Phone, Clock } from "lucide-react";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";

const serviceIds = ["classic-cut", "fade-cut", "beard-trim", "royal-shave", "cut-beard", "vip-grooming"];

export default function Footer() {
  const { lang } = useLang();
  const tx = useT(lang);
  const ft = tx.footer;
  const services = tx.services;

  const serviceNames = {
    tr: ["Klasik Kesim", "Soluk & Kıvrım", "Sakal Şekillendirme", "Usta Tıraşı", "Kesim & Sakal", "VIP Bakım"],
    en: ["Classic Cut", "Fade & Taper", "Beard Sculpt", "Royal Shave", "Cut & Beard", "VIP Grooming"],
  };

  return (
    <footer className="bg-[#080808] border-t border-[#242424] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-[#242424]">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-[#CC1A1A] flex items-center justify-center">
                <span className="font-display text-base font-bold text-white">M</span>
              </div>
              <span className="font-display text-2xl tracking-[0.3em] text-[#F8F6F1] uppercase">Makas</span>
            </div>
            <p className="text-[#6B6660] text-sm leading-relaxed mb-6">{ft.tagline}</p>
            <div className="flex gap-4">
              {[Share2, Link2, Globe].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 border border-[#242424] flex items-center justify-center text-[#6B6660] hover:text-[#F8F6F1] hover:border-[#CC1A1A] transition-all duration-200"
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#CC1A1A] mb-6 font-medium">{ft.services}</h4>
            <ul className="space-y-3">
              {serviceNames[lang].map((s) => (
                <li key={s}>
                  <Link href="/book" className="text-sm text-[#6B6660] hover:text-[#F8F6F1] transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#CC1A1A] mb-6 font-medium">{ft.company}</h4>
            <ul className="space-y-3">
              {ft.companyLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-[#6B6660] hover:text-[#F8F6F1] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-widest uppercase text-[#CC1A1A] mb-6 font-medium">{ft.visit}</h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <MapPin size={14} className="text-[#CC1A1A] mt-0.5 shrink-0" />
                <span className="text-sm text-[#6B6660]">
                  {lang === "tr" ? "Büyük Çarşı No:42, Fatih\nİstanbul 34110" : "Grand Bazaar No:42, Fatih\nIstanbul 34110"}
                </span>
              </li>
              <li className="flex gap-3 items-center">
                <Phone size={14} className="text-[#CC1A1A] shrink-0" />
                <span className="text-sm text-[#6B6660]">+90 212 123 45 67</span>
              </li>
              <li className="flex gap-3 items-start">
                <Clock size={14} className="text-[#CC1A1A] mt-0.5 shrink-0" />
                <span className="text-sm text-[#6B6660]">
                  {ft.hours.weekdays}<br />
                  {ft.hours.sat}<br />
                  {ft.hours.sun}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6B6660] tracking-wider">
            © 2026 MAKAS. {ft.rights}
          </p>
          <div className="flex gap-6">
            {[ft.privacy, ft.terms, ft.cookies].map((item) => (
              <a key={item} href="#" className="text-xs text-[#6B6660] hover:text-[#F8F6F1] tracking-wider transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
