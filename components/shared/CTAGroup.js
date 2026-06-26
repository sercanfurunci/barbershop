import { cn } from "@/lib/utils";

export default function CTAGroup({
  children,
  align = "start",
  stackOnMobile = true,
  className,
}) {
  const alignClass =
    align === "center"
      ? "justify-center"
      : align === "end"
      ? "justify-end"
      : "justify-start";

  return (
    <div
      className={cn(
        "flex w-full gap-3 sm:gap-4 items-stretch sm:items-center",
        stackOnMobile ? "flex-col sm:flex-row" : "flex-row flex-wrap",
        alignClass,
        className
      )}
    >
      {children}
    </div>
  );
}
