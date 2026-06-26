"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp, ChevronRight } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import Eyebrow from "@/components/shared/Eyebrow";

const CROSS_LINKS = [
  { slug: "gizlilik",            label: "Gizlilik Politikası" },
  { slug: "kullanim-kosullari",  label: "Kullanım Koşulları" },
  { slug: "cerez-politikasi",    label: "Çerez Politikası" },
];

export default function LegalLayout({
  eyebrow = "Yasal",
  title,
  lede,
  updated,
  toc = [],
  currentSlug,
  children,
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero band */}
        <section className="border-b border-border bg-background">
          <div
            className="mx-auto max-w-[1100px] px-6"
            style={{ paddingTop: "clamp(56px, 8vw, 96px)", paddingBottom: "clamp(40px, 6vw, 64px)" }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground mb-8 no-underline"
            >
              ← Ana sayfa
            </Link>
            {updated && (
              <div className="mb-5">
                <Eyebrow>Son güncelleme · {updated}</Eyebrow>
              </div>
            )}
            <p className="mb-3">
              <Eyebrow>{eyebrow}</Eyebrow>
            </p>
            <h1
              className="font-display font-bold text-foreground leading-[1.04]"
              style={{ fontSize: "clamp(36px, 5.6vw, 64px)", letterSpacing: "-2px" }}
            >
              {title}
            </h1>
            {lede && (
              <p
                className="mt-6 max-w-[720px] text-muted-foreground leading-relaxed"
                style={{ fontSize: "clamp(16px, 1.6vw, 19px)" }}
              >
                {lede}
              </p>
            )}
          </div>
        </section>

        {/* Body: sticky TOC on desktop + reading column */}
        <section
          className="bg-background"
          style={{ paddingTop: "clamp(40px, 6vw, 72px)", paddingBottom: "clamp(80px, 11vw, 128px)" }}
        >
          <div className="mx-auto max-w-[1100px] px-6 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-x-14 gap-y-10">
            {/* TOC */}
            {toc.length > 0 && (
              <aside className="lg:sticky lg:top-28 self-start">
                <Eyebrow className="block mb-4">Bu sayfada</Eyebrow>
                <TableOfContents toc={toc} />
              </aside>
            )}

            {/* Content column */}
            <div className="max-w-[720px]">
              <article className="legal-prose">{children}</article>

              {/* Cross-links */}
              <div className="mt-16 pt-10 border-t border-border">
                <Eyebrow className="block mb-5">Diğer yasal belgeler</Eyebrow>
                <div className="grid sm:grid-cols-2 gap-3">
                  {CROSS_LINKS.filter((l) => l.slug !== currentSlug).map((l) => (
                    <Link
                      key={l.slug}
                      href={`/${l.slug}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 no-underline hover:shadow-[var(--shadow-card)] transition-shadow"
                    >
                      <span className="text-[15px] font-semibold text-foreground">{l.label}</span>
                      <ChevronRight
                        size={16}
                        className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
      <BackToTop />
    </div>
  );
}

function TableOfContents({ toc }) {
  const [active, setActive] = useState(toc[0]?.id);

  useEffect(() => {
    const ids = toc.map((t) => t.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [toc]);

  return (
    <nav>
      <ol className="m-0 flex list-none flex-col gap-1 p-0 border-l border-border">
        {toc.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block py-1.5 pl-4 -ml-px border-l-2 text-[13.5px] leading-snug no-underline transition-colors ${
                  isActive
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Sayfanın başına dön"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background hover:bg-[var(--makas-ink-secondary)] transition-colors"
      style={{ boxShadow: "var(--shadow-pop)" }}
    >
      <ArrowUp size={18} />
    </button>
  );
}

// ── Building blocks for the body ─────────────────────────────────────────────

export function Section({ id, number, title, children }) {
  return (
    <section
      id={id}
      className="scroll-mt-28 first:mt-0 mt-14"
    >
      <div className="flex items-baseline gap-3 mb-5">
        {number != null && (
          <span className="font-mono-custom text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
            {String(number).padStart(2, "0")}
          </span>
        )}
        <h2
          className="font-display font-bold text-foreground tracking-[-0.5px] leading-[1.15]"
          style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}
        >
          {title}
        </h2>
      </div>
      <div className="legal-body">{children}</div>
    </section>
  );
}

export function Note({ children, tone = "default" }) {
  const styles =
    tone === "warning"
      ? "border-amber-300 bg-amber-50 text-amber-900"
      : "border-border bg-secondary text-foreground";
  return (
    <div className={`my-5 rounded-xl border px-5 py-4 text-[14.5px] leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}
