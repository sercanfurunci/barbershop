import { cn } from "@/lib/utils";

export default function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon,
  className,
}) {
  const deltaClass =
    deltaTone === "up"
      ? "text-emerald-700 bg-emerald-50"
      : deltaTone === "down"
      ? "text-red-700 bg-red-50"
      : "text-[var(--makas-ink-secondary)] bg-[var(--makas-surface2)]";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-[var(--makas-surface)] p-5 sm:p-6",
        "border-[var(--makas-border)]",
        className
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium uppercase tracking-[0.08em] text-[var(--makas-ink-muted)]">
          {label}
        </span>
        {icon && (
          <span className="text-[var(--makas-ink-muted)] shrink-0">{icon}</span>
        )}
      </div>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display text-3xl sm:text-4xl leading-none tracking-tight text-[var(--makas-ink)]">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              deltaClass
            )}
          >
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}
