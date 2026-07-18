"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Tema değiştir"
      style={{
        width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, border: "1px solid var(--makas-border)", background: "none",
        color: "var(--makas-ink-muted)", cursor: "pointer", transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.color = "var(--makas-ink)"; e.currentTarget.style.borderColor = "var(--makas-ink)"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "var(--makas-ink-muted)"; e.currentTarget.style.borderColor = "var(--makas-border)"; }}
      suppressHydrationWarning
    >
      {/* ponytail: CSS swap avoids hydration mismatch — Sun/Moon toggled by .dark class, not JS on first paint */}
      <Moon size={15} className="dark:hidden" />
      <Sun size={15} className="hidden dark:block" />
    </button>
  );
}
