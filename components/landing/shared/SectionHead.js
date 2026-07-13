"use client";

import FadeUp from "@/components/landing/shared/FadeUp";
import Eyebrow from "@/components/shared/Eyebrow";

export default function SectionHead({ eyebrow, title, sub, align = "center", maxWidth = 720, light = false }) {
  const alignCls = align === "left" ? "text-left" : "text-center mx-auto";
  return (
    <FadeUp className={alignCls} style={{ maxWidth }}>
      {eyebrow && (
        <div className="mb-4">
          <Eyebrow className={light ? "text-white/60" : ""}>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2
        className={`font-display font-bold leading-[1.05] ${light ? "text-white" : "text-foreground"}`}
        style={{ fontSize: "clamp(32px, 5vw, 54px)", letterSpacing: "-1.5px" }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 leading-relaxed ${light ? "text-white/70" : "text-muted-foreground"}`}
          style={{ fontSize: "clamp(15px, 1.5vw, 18px)" }}
        >
          {sub}
        </p>
      )}
    </FadeUp>
  );
}
