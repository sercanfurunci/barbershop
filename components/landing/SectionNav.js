"use client";

// Sticky horizontal section nav. Appears once the IdentityBlock has scrolled
// out of view, hides while it's still in view. Sections list is conditional
// — empty sections don't get a link. Hidden on mobile — Navbar's hamburger
// already covers section jumps and the horizontal scroll bar adds noise.

import { useEffect, useState } from "react";
import { useLang } from "@/contexts/LanguageContext";

export default function SectionNav({ sections }) {
  const { lang } = useLang();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = document.querySelector("[data-identity]");
    if (!sentinel) { setStuck(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  if (!sections?.length) return null;

  return (
    <nav
      data-section-nav
      aria-label={lang === "tr" ? "Sayfa bölümleri" : "Page sections"}
      className={`section-nav hidden md:block${stuck ? " is-stuck" : ""}`}
      style={{
        position: "sticky",
        top: "88px", // sit below the fixed Navbar
        zIndex: 30,
        background: stuck ? "var(--nav-bg-default)" : "transparent",
        backdropFilter: stuck ? "saturate(140%) blur(8px)" : "none",
        WebkitBackdropFilter: stuck ? "saturate(140%) blur(8px)" : "none",
        borderBottom: stuck ? "1px solid var(--makas-border)" : "1px solid transparent",
      }}
    >
      <div style={{
        width: "min(1280px, 100%)",
        marginInline: "auto",
        paddingInline: "clamp(16px, 4vw, 32px)",
        display: "flex",
        gap: 4,
        overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            style={{
              flexShrink: 0,
              padding: "14px 14px",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--makas-ink-secondary)",
              textDecoration: "none",
              letterSpacing: "0.01em",
              borderBottom: "2px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--makas-ink)";
              e.currentTarget.style.borderColor = "var(--makas-ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--makas-ink-secondary)";
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            {s.label[lang]}
          </a>
        ))}
      </div>
    </nav>
  );
}
