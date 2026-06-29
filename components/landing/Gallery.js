"use client";

// ponytail: native <dialog> for ESC + a11y baseline; arrow nav, swipe,
// thumb rail, adjacent-only preload added on top. No focus-trap lib —
// dialog.showModal() already traps tab within the dialog subtree.

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const SWIPE_THRESHOLD = 40;

export default function Gallery({ images, shopName, aside = null }) {
  const [open, setOpen]   = useState(null); // index or null
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const touchStartX = useRef(null);
  const thumbsRef = useRef(null);

  const total = images?.length ?? 0;

  const next = useCallback(() => {
    setOpen((i) => (i == null ? i : (i + 1) % total));
  }, [total]);
  const prev = useCallback(() => {
    setOpen((i) => (i == null ? i : (i - 1 + total) % total));
  }, [total]);
  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open != null && !d.open) {
      d.showModal();
      // focus the close button so first Tab cycles within the dialog
      requestAnimationFrame(() => closeBtnRef.current?.focus({ preventScroll: true }));
    }
    if (open == null && d.open) d.close();
  }, [open]);

  // Lock body scroll while the lightbox is open (some browsers leak wheel
  // events through the dialog backdrop).
  useEffect(() => {
    if (open == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Keyboard arrows. ESC is handled by <dialog> natively.
  useEffect(() => {
    if (open == null) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev]);

  // Scroll active thumb into view (only within thumb rail, never the page)
  useEffect(() => {
    if (open == null) return;
    const rail = thumbsRef.current;
    const el   = rail?.querySelector(`[data-idx="${open}"]`);
    if (!rail || !el) return;
    const target = el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2;
    rail.scrollTo({ left: target, behavior: "smooth" });
  }, [open]);

  if (!images || images.length === 0) return null;

  const showThumbs = images.length >= 5;

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) (dx < 0 ? next : prev)();
    touchStartX.current = null;
  };

  // Show at most 3 preview tiles; the remainder lives in the lightbox so the
  // landing page stays short. Last visible tile carries a "+X" overlay when
  // there's overflow. Mobile uses a snap-scroll row, desktop a featured-+-stack
  // grid (Airbnb-style).
  const visible    = images.slice(0, 3);
  const overflow   = Math.max(0, images.length - visible.length);
  const lastIdx    = visible.length - 1;
  const onlyOne    = visible.length === 1;

  const tileButton = (url, i, { className, sizes }) => (
    <button
      key={url + i}
      type="button"
      onClick={() => setOpen(i)}
      className={`group relative overflow-hidden rounded-xl bg-stone-200 ${className}`}
      style={{ border: 0, padding: 0, cursor: "pointer" }}
      aria-label={i === lastIdx && overflow > 0
        ? `Tüm galeriyi aç — ${images.length} fotoğraf`
        : `Galeri görseli ${i + 1}`}
    >
      <Image
        src={url}
        alt={shopName ? `${shopName} — Galeri ${i + 1}` : `Galeri ${i + 1}`}
        fill
        sizes={sizes}
        loading={i === 0 ? "eager" : "lazy"}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      {i === lastIdx && overflow > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(10,10,10,0.55)",
            color: "#fff",
            fontSize: "clamp(20px, 3vw, 30px)",
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          +{overflow}
        </span>
      )}
    </button>
  );

  const imageGrid = (
    <>
      {/* Mobile: horizontal snap scroller. Media query lives in this <style>
          so it beats Tailwind's md:hidden specificity — without it, both rows
          render on desktop. */}
      <style>{`
        .gallery-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          margin-inline: calc(-1 * clamp(20px, 5vw, 40px));
          padding-inline: clamp(20px, 5vw, 40px);
        }
        .gallery-row::-webkit-scrollbar { display: none; }
        .gallery-row > * {
          flex: 0 0 78%;
          max-width: 320px;
          scroll-snap-align: start;
          aspect-ratio: 4 / 3;
          position: relative;
        }
        @media (min-width: 768px) {
          .gallery-row { display: none; }
        }
      `}</style>
      <div className="gallery-row">
        {visible.map((url, i) => tileButton(url, i, {
          className: "",
          sizes: "78vw",
        }))}
      </div>

      {/* Desktop: featured tall + two stacked */}
      <div
        className="hidden md:grid gap-3"
        style={{
          gridTemplateColumns: onlyOne ? "1fr" : "2fr 1fr",
          gridAutoRows: "minmax(0, 1fr)",
          aspectRatio: onlyOne ? "16 / 9" : "16 / 10",
        }}
      >
        {tileButton(visible[0], 0, {
          className: `${visible.length >= 2 ? "row-span-2" : ""} h-full`,
          sizes: "(max-width: 1024px) 60vw, 720px",
        })}
        {visible[1] && tileButton(visible[1], 1, {
          className: "h-full",
          sizes: "(max-width: 1024px) 30vw, 360px",
        })}
        {visible[2] && tileButton(visible[2], 2, {
          className: "h-full",
          sizes: "(max-width: 1024px) 30vw, 360px",
        })}
      </div>
    </>
  );

  return (
    <section id="gallery" style={{
      background: "var(--makas-bg)",
      padding: "clamp(20px, 3.2vw, 44px) clamp(16px, 3vw, 32px) clamp(40px, 6vw, 72px)",
    }}>
      <div style={{ maxWidth: 1560, marginInline: "auto" }}>
        {aside ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 lg:gap-6 items-start">
            <div className="min-w-0">{imageGrid}</div>
            <aside className="w-full lg:max-w-[480px] lg:justify-self-end lg:sticky" style={{ top: 24 }}>
              {aside}
            </aside>
          </div>
        ) : (
          imageGrid
        )}
      </div>

      {/* Lightbox */}
      <style>{`
        .gallery-lightbox::backdrop {
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(2px);
        }
      `}</style>
      <dialog
        ref={dialogRef}
        className="gallery-lightbox"
        onClose={close}
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}
        aria-label="Galeri görüntüleyici"
        style={{
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: 0,
          width: "min(92vw, 1100px)",
          height: "min(86dvh, 780px)",
          maxWidth: "92vw", maxHeight: "86dvh",
          borderRadius: 14,
          overflow: "hidden",
          color: "#fff",
          margin: "auto",
        }}
      >
        {open != null && (
          <div
            style={{
              position: "relative", width: "100%", height: "100%",
              display: "flex", flexDirection: "column",
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Top bar */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 18px", flexShrink: 0,
            }}>
              <div style={{
                fontSize: 13, fontVariantNumeric: "tabular-nums",
                color: "rgba(255,255,255,0.75)", letterSpacing: "0.05em",
              }}>
                {open + 1} / {total}
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={close}
                aria-label="Kapat"
                style={{
                  width: 38, height: 38, borderRadius: 999,
                  background: "rgba(255,255,255,0.08)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Image stage */}
            <div style={{
              position: "relative", flex: 1, minHeight: 0,
              overflow: "hidden",
            }}>
              <Image
                src={images[open]}
                alt={shopName ? `${shopName} — Galeri ${open + 1}` : `Galeri ${open + 1}`}
                fill
                sizes="(max-width: 1200px) 92vw, 1100px"
                priority
                style={{ objectFit: "contain" }}
              />

              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Önceki görsel"
                    style={navBtn("left")}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Sonraki görsel"
                    style={navBtn("right")}
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail rail */}
            {showThumbs && (
              <div
                ref={thumbsRef}
                style={{
                  display: "flex", gap: 8, padding: "12px 16px 18px",
                  overflowX: "auto", flexShrink: 0,
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                  justifyContent: "center",
                }}
              >
                {images.map((url, i) => (
                  <button
                    key={i}
                    data-idx={i}
                    type="button"
                    onClick={() => setOpen(i)}
                    aria-label={`Görsel ${i + 1}'e git`}
                    aria-current={i === open}
                    style={{
                      position: "relative", flex: "0 0 auto",
                      width: 64, height: 64, borderRadius: 6, overflow: "hidden",
                      border: i === open
                        ? "2px solid #fff"
                        : "2px solid rgba(255,255,255,0.18)",
                      padding: 0, cursor: "pointer",
                      background: "#111",
                      opacity: i === open ? 1 : 0.6,
                      transition: "opacity 0.15s, border-color 0.15s",
                    }}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="64px"
                      style={{ objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </dialog>
    </section>
  );
}

function navBtn(side) {
  return {
    position: "absolute",
    top: 0, bottom: 0, margin: "auto 0",
    [side]: 12,
    width: 44, height: 44, borderRadius: 999,
    background: "rgba(0,0,0,0.45)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", zIndex: 2,
  };
}
