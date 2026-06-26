import { cn } from "@/lib/utils";

export default function TrustBadge({
  icon,
  label,
  sublabel,
  className,
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border bg-[var(--makas-surface)]/80 backdrop-blur-sm",
        "border-[var(--makas-border)] px-3.5 py-2",
        className
      )}
    >
      {icon && (
        <span className="text-[var(--makas-ink)] shrink-0 flex items-center">
          {icon}
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className="text-[13px] font-medium text-[var(--makas-ink)]">
          {label}
        </span>
        {sublabel && (
          <span className="text-[11px] text-[var(--makas-ink-muted)]">
            {sublabel}
          </span>
        )}
      </span>
    </div>
  );
}
