import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";

export type Language = "en" | "ar";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (en: string | undefined | null, ar: string | undefined | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("aivec_lang");
    return (saved === "ar" || saved === "en") ? saved : "ar";
  });

  // Sync lang with URL
  useEffect(() => {
    const pathLang = location.split("/")[1];
    if (pathLang === "en" || pathLang === "ar") {
      setLangState(pathLang);
      localStorage.setItem("aivec_lang", pathLang);
      document.documentElement.lang = pathLang;
      document.documentElement.dir = pathLang === "ar" ? "rtl" : "ltr";
      if (pathLang === "ar") {
        document.documentElement.classList.add("font-arabic");
        document.documentElement.classList.remove("font-sans");
      } else {
        document.documentElement.classList.add("font-sans");
        document.documentElement.classList.remove("font-arabic");
      }
    } else if (location === "/") {
      setLocation(`/${lang}`);
    }
  }, [location, lang, setLocation]);

  const setLang = (newLang: Language) => {
    localStorage.setItem("aivec_lang", newLang);
    const parts = location.split("/");
    if (parts[1] === "en" || parts[1] === "ar") {
      parts[1] = newLang;
      setLocation(parts.join("/") || "/");
    } else {
      setLocation(`/${newLang}${location}`);
    }
  };

  const t = (en: string | undefined | null, ar: string | undefined | null) => {
    if (lang === "ar" && ar) return ar;
    if (lang === "en" && en) return en;
    return ar || en || "";
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
