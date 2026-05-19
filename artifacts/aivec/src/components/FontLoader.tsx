import { useEffect } from "react";
import { useGetSiteSettings } from "@workspace/api-client-react";

const GOOGLE_FONTS_ID = "aivec-dynamic-fonts";

function buildGoogleFontsUrl(families: string[]): string {
  const params = families
    .filter(Boolean)
    .map((f) => `family=${encodeURIComponent(f.trim()).replace(/%20/g, "+")}:wght@300;400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function FontLoader() {
  const { data: settings } = useGetSiteSettings();

  useEffect(() => {
    const rawEn = settings?.fontEn?.trim() || "Fraunces";
    const rawAr = settings?.fontAr?.trim() || "Cairo";
    // Allow only safe font-name characters to prevent CSS/URL injection.
    const safe = (v: string, fallback: string) =>
      /^[A-Za-z0-9 _-]{1,64}$/.test(v) ? v : fallback;
    const fontEn = safe(rawEn, "Fraunces");
    const fontAr = safe(rawAr, "Cairo");

    let link = document.getElementById(GOOGLE_FONTS_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = GOOGLE_FONTS_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = buildGoogleFontsUrl([fontEn, fontAr]);

    const root = document.documentElement;
    root.style.setProperty("--app-font-serif", `'${fontEn}', serif`);
    root.style.setProperty("--app-font-arabic", `'${fontAr}', sans-serif`);
  }, [settings?.fontEn, settings?.fontAr]);

  return null;
}
