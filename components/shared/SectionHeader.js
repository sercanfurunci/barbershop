import { cn } from "@/lib/utils";
import Eyebrow from "./Eyebrow";

export default function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
  titleAs: Heading = "h2",
}) {
  const isCenter = align === "center";
  return (
    <header
      className={cn(
        "flex w-full gap-6",
        isCenter ? "flex-col items-center text-center" : "flex-col md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn("flex flex-col gap-3 max-w-2xl", isCenter && "items-center")}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight text-[var(--makas-ink)]">
          {title}
        </Heading>
        {description && (
          <p className="text-base sm:text-lg text-[var(--makas-ink-secondary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
