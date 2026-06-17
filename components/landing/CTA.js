"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useLang } from "@/contexts/LanguageContext";
import { useT } from "@/lib/translations";
import { ArrowRight, Phone } from "lucide-react";

export default function CTA() {
  const { lang } = useLang();
  const tx = useT(lang);

  return (
    <section style={{ background: "#C62828", position: "relative", overflow: "hidden" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 xl:px-16 py-24 lg:py-32">

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-light"
          style={{
            fontSize: "clamp(48px, 7vw, 96px)",
            letterSpacing: "-0.03em",
            lineHeight: 0.92,
            marginBottom: "52px",
            textWrap: "balance",
          }}
        >
          <span style={{ color: "#fff", display: "block" }}>{tx.cta.title[0]}</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontStyle: "italic", display: "block" }}>
            {tx.cta.title[1]}
          </span>
        </motion.h2>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 mb-16"
        >
          <Link
            href="/book"
            className="group inline-flex items-center justify-center gap-2"
            style={{
              background: "#fff",
              color: "#C62828",
              padding: "17px 40px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.01em",
              textDecoration: "none",
              transition: "background 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#F6F3EE"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            {tx.cta.bookButton}
            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="tel:+905373305973"
            className="inline-flex items-center justify-center gap-2"
            style={{
              color: "rgba(255,255,255,0.65)",
              padding: "17px 28px",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 500,
              border: "1px solid rgba(255,255,255,0.2)",
              textDecoration: "none",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          >
            <Phone size={15} />
            {tx.cta.callButton}
          </a>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap gap-x-10 gap-y-2 pt-7"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          {tx.cta.trust.map(item => (
            <div key={item} className="flex items-center gap-2">
              <div style={{ width: "3px", height: "3px", background: "rgba(255,255,255,0.3)", borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.03em" }}>
                {item}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
