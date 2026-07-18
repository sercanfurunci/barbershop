"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import SectionHead from "@/components/landing/shared/SectionHead";
import { FAQS } from "@/components/landing/data/landingData";

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 border-0 bg-transparent py-5 text-left text-[16px] font-semibold text-foreground tracking-[-0.2px] cursor-pointer"
      >
        <span>{q}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22, ease: "easeInOut" }} className="inline-flex shrink-0 text-muted-foreground">
          <ChevronDown size={20} strokeWidth={2.2} />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="m-0 pb-6 pr-10 text-[15px] text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </div>
  );
}

export default function FAQSection() {
  const [open, setOpen] = useState(-1); // all collapsed on load
  return (
    <section id="faq" style={{ background: "var(--makas-bg)", padding: "clamp(80px, 11vw, 128px) clamp(20px, 4vw, 32px)" }}>
      <div className="mx-auto max-w-[820px]">
        <SectionHead eyebrow="SSS" title="Aklındaki sorulara cevap." />
        <div className="mt-12">
          {FAQS.map((f, i) => (
            <FAQItem key={f.q} q={f.q} a={f.a} isOpen={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
