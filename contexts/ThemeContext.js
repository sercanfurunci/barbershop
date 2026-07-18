"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext({ theme: "system", setTheme: () => {} });

function applyTheme(t) {
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");

  useEffect(() => {
    const saved = localStorage.getItem("makas-theme") ?? "system";
    setThemeState(saved);
    applyTheme(saved);

    if (saved !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const fn = () => applyTheme("system");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem("makas-theme", t);
    applyTheme(t);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
