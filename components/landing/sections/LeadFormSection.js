"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

import FadeUp from "@/components/landing/shared/FadeUp";
import Eyebrow from "@/components/shared/Eyebrow";

export default function LeadFormSection() {
  const [form, setForm] = useState({ businessName: "", name: "", phone: "", email: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error || "Bir hata oluştu."); setStatus("error"); }
      else setStatus("success");
    } catch {
      setErrMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
      setStatus("error");
    }
  }

  const inputClass = "w-full rounded-[12px] border border-border bg-card px-3.5 py-3 text-[15px] text-foreground outline-none focus:border-foreground/40 transition-colors";

  return (
    <section id="contact" style={{ background: "var(--makas-bg)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[1100px] grid lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
        <FadeUp>
          <Eyebrow className="mb-4 block">İletişim</Eyebrow>
          <h2 className="font-display font-bold text-foreground leading-[1.05]" style={{ fontSize: "clamp(30px, 4.2vw, 44px)", letterSpacing: "-1.2px" }}>
            Salonunuz için<br />sistemi konuşalım.
          </h2>
          <p className="mt-5 text-muted-foreground leading-relaxed" style={{ fontSize: "17px" }}>
            Formu doldurun, en kısa sürede size ulaşıp salonunuza özel kurulumu başlatalım.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-secondary-foreground">
            {["Ücretsiz kurulum + ilk ay rehberlik", "Sözleşme yok, istediğin zaman iptal", "WhatsApp destek hattı"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <CheckCircle size={16} strokeWidth={2.2} className="text-foreground shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </FadeUp>

        {status === "success" ? (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-7 py-12 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-emerald-600" />
            <p className="mb-1.5 text-[17px] font-semibold text-emerald-800">Mesajınızı aldık!</p>
            <p className="text-sm text-emerald-900">En kısa sürede döneceğiz.</p>
          </motion.div>
        ) : (
          <FadeUp delay={0.1}>
            <form onSubmit={submit} className="rounded-[20px] border border-border bg-card p-7 flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-business" className="mb-1.5 block text-[13px] font-medium text-foreground">Salon adı *</label>
                  <input id="lead-business" required value={form.businessName} onChange={set("businessName")} placeholder="Salon adınız" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="lead-name" className="mb-1.5 block text-[13px] font-medium text-foreground">Adınız *</label>
                  <input id="lead-name" required value={form.name} onChange={set("name")} placeholder="Adınız Soyadınız" className={inputClass} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-phone" className="mb-1.5 block text-[13px] font-medium text-foreground">Telefon *</label>
                  <input id="lead-phone" required type="tel" value={form.phone} onChange={set("phone")} placeholder="0555 123 4567" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="lead-email" className="mb-1.5 block text-[13px] font-medium text-foreground">E-posta</label>
                  <input id="lead-email" type="email" value={form.email} onChange={set("email")} placeholder="salon@email.com" className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="lead-message" className="mb-1.5 block text-[13px] font-medium text-foreground">Mesaj</label>
                <textarea id="lead-message" value={form.message} onChange={set("message")} placeholder="Salon hakkında kısaca bilgi verin..." rows={3} className={`${inputClass} resize-none`} />
              </div>
              {errMsg && <p className="text-sm text-red-600">{errMsg}</p>}
              <button
                type="submit"
                disabled={status === "loading"}
                className="mt-1 rounded-[12px] bg-foreground px-6 py-3.5 text-[15px] font-semibold text-background hover:opacity-85 disabled:opacity-50 transition-opacity cursor-pointer border-0"
              >
                {status === "loading" ? "Gönderiliyor…" : "Gönder"}
              </button>
            </form>
          </FadeUp>
        )}
      </div>
    </section>
  );
}
