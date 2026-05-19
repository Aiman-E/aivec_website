import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";

export type Language = "en" | "ar";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (en: string | undefined | null, ar: string | undefined | null) => string;
  tStatus: (status: string | undefined | null) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Centralized translations for DB enum-like values (event status, registration
// status, sponsor tier). Keeps backend free of presentation strings while
// guaranteeing both languages render correctly.
const STATUS_TRANSLATIONS: Record<string, { en: string; ar: string }> = {
  // Event status
  open: { en: "Open", ar: "متاح للتسجيل" },
  coming_soon: { en: "Coming Soon", ar: "قريباً" },
  closed: { en: "Closed", ar: "مغلق" },
  draft: { en: "Draft", ar: "مسودة" },
  past: { en: "Past", ar: "منتهي" },
  archived: { en: "Archived", ar: "مؤرشف" },
  // Registration status
  submitted: { en: "Submitted", ar: "تم الإرسال" },
  reviewed: { en: "Under Review", ar: "قيد المراجعة" },
  accepted: { en: "Accepted", ar: "مقبول" },
  rejected: { en: "Rejected", ar: "مرفوض" },
  // Sponsor tier
  government: { en: "Government", ar: "حكومي" },
  platinum: { en: "Platinum", ar: "بلاتيني" },
  gold: { en: "Gold", ar: "ذهبي" },
  silver: { en: "Silver", ar: "فضي" },
  bronze: { en: "Bronze", ar: "برونزي" },
  supporter: { en: "Supporter", ar: "داعم" },
};

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
    if (lang === "ar") return (ar || en || "");
    return (en || ar || "");
  };

  const tStatus = (status: string | undefined | null) => {
    if (!status) return "";
    const entry = STATUS_TRANSLATIONS[status];
    if (entry) return t(entry.en, entry.ar);
    // Graceful fallback for any unknown status: humanise the key
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tStatus }}>
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

// Shared cross-route section navigator. Wouter strips hashes from
// setLocation, so when navigating from a detail page back to the home page
// we queue the target in sessionStorage; Home.tsx polls for the element on
// mount and scrolls when it appears.
export function useNavigateToSection() {
  const { lang } = useLanguage();
  const [location, setLocation] = useLocation();
  return (hash: string) => {
    if (location === `/${lang}`) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      sessionStorage.setItem("aivec_scroll_to", hash);
      setLocation(`/${lang}`);
    }
  };
}
