"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext({ lang: "tr", setLang: () => {} });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("tr");

  useEffect(() => {
    const saved = localStorage.getItem("makas-lang");
    if (saved === "en" || saved === "tr") setLangState(saved);
  }, []);

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem("makas-lang", l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
