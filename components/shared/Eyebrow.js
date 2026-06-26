import { cn } from "@/lib/utils";

export default function Eyebrow({ as: Tag = "span", className, children, ...rest }) {
  return (
    <Tag
      className={cn(
        "font-mono-custom uppercase tracking-[0.14em] text-[11px] sm:text-xs text-[var(--makas-ink-muted)]",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
