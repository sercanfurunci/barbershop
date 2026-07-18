import Link from "next/link";

/**
 * Official MAKAS brand logo — the ONLY place the scissors mark + wordmark are rendered.
 * Import this everywhere a logo is needed. Never recreate inline.
 *
 * variant      "dark"  = black scissors (for light backgrounds, default)
 *              "light" = white scissors (for dark backgrounds)
 * size         scissors mark size in px (wordmark scales proportionally)
 * showWordmark include "MAKAS" text next to the mark (default true)
 * href         wrap in a Link when provided
 */
export default function Logo({ variant, href, size = 40, showWordmark = true, className }) {
  // ponytail: CSS-based swap avoids hydration mismatch from JS theme reads
  const isAuto = !variant;
  const src = variant === "light" ? "/logo-light.svg" : variant === "dark" ? "/logo-dark.svg" : null;
  const wordColor = variant === "light" ? "text-background" : variant === "dark" ? "text-foreground" : null;
  const gap = Math.round(size * 0.35);
  const fs = Math.round(size * 0.6);

  const content = (
    <>
      {isAuto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.svg" alt="MAKAS" width={size} height={size} className="block shrink-0 dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-light.svg" alt="" width={size} height={size} className="hidden shrink-0 dark:block" aria-hidden="true" />
        </>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="MAKAS" width={size} height={size} className="block shrink-0" />
      )}
      {showWordmark && (
        <span
          className={`font-display font-extrabold leading-none tracking-[-0.02em] ${isAuto ? "text-foreground dark:text-background" : wordColor}`}
          style={{ fontSize: fs }}
        >
          MAKAS
        </span>
      )}
    </>
  );

  const cls = `inline-flex items-center ${className ?? ""}`;
  const style = showWordmark ? { gap } : undefined;

  if (href) return <Link href={href} className={`${cls} no-underline`} style={style}>{content}</Link>;
  return <span className={cls} style={style}>{content}</span>;
}
