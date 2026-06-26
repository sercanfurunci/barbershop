import Link from "next/link";
import { cn } from "@/lib/utils";

const VARIANT = {
  primary:
    "bg-[var(--makas-ink)] text-white border-transparent hover:bg-[var(--makas-ink-secondary)]",
  secondary:
    "bg-[var(--makas-surface)] text-[var(--makas-ink)] border-[var(--makas-border)] hover:bg-[var(--makas-surface2)]",
  ghost:
    "bg-transparent text-[var(--makas-ink)] border-transparent hover:bg-[var(--makas-surface2)]",
  outline:
    "bg-transparent text-[var(--makas-ink)] border-[var(--makas-ink)] hover:bg-[var(--makas-ink)] hover:text-white",
};

const SIZE = {
  sm: "h-[var(--pill-h-sm)] px-5 text-sm",
  md: "h-[var(--pill-h-md)] px-6 text-[15px]",
  lg: "h-[var(--pill-h-lg)] px-7 text-base",
};

export default function PillButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  iconLeft,
  iconRight,
  type,
  ...rest
}) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full border font-medium tracking-[-0.01em] transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--makas-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--makas-bg)]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "touch-manipulation select-none",
    VARIANT[variant] || VARIANT.primary,
    SIZE[size] || SIZE.md,
    className
  );

  const content = (
    <>
      {iconLeft && <span className="shrink-0">{iconLeft}</span>}
      <span>{children}</span>
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type || "button"} className={classes} {...rest}>
      {content}
    </button>
  );
}
