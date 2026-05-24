import { useEffect } from "react";
import { useGetSiteSettings } from "@workspace/api-client-react";
import { resolveImageUrl } from "@/components/admin/ImageUploadField";

const GOOGLE_FONTS_ID = "aivec-dynamic-fonts";
const CUSTOM_FONTS_ID = "aivec-custom-fonts";

// Strict family-name allow-list: letters, digits, space, underscore, hyphen.
// Anything else (quotes, semicolons, braces, RTL marks, etc.) falls back.
const FONT_NAME_RE = /^[A-Za-z0-9 _-]{1,64}$/;

export function sanitizeFontName(value: string | null | undefined, fallback: string): string {
  const v = (value ?? "").trim();
  return FONT_NAME_RE.test(v) ? v : fallback;
}

// Sanitize a font URL: must resolve to a same-origin object path
// (`/objects/...` → `/api/storage/objects/...`) or a plain https URL.
// Reject anything containing quotes, parentheses, whitespace, backslashes,
// or control characters that could break out of `url('...')`.
export function sanitizeFontUrl(value: string | null | undefined): string {
  if (!value) return "";
  const resolved = resolveImageUrl(value).trim();
  if (!resolved) return "";
  if (/['"()\\\s\u0000-\u001f<>]/.test(resolved)) return "";
  const okHttps = /^https:\/\/[A-Za-z0-9._~:/?#@!$&*+,;=%-]+$/.test(resolved);
  const okPath = /^\/[A-Za-z0-9._~:/?#@!$&*+,;=%-]+$/.test(resolved);
  if (!okHttps && !okPath) return "";
  return resolved;
}

export function guessFontFormat(url: string): string {
  const u = url.split("?")[0].toLowerCase();
  if (u.endsWith(".woff2")) return "woff2";
  if (u.endsWith(".woff")) return "woff";
  if (u.endsWith(".ttf")) return "truetype";
  if (u.endsWith(".otf")) return "opentype";
  return "truetype";
}

function buildGoogleFontsUrl(families: string[]): string {
  const params = families
    .filter(Boolean)
    .map((f) => `family=${encodeURIComponent(f.trim()).replace(/%20/g, "+")}:wght@300;400;500;600;700;800`)
    .join("&");
  if (!params) return "";
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function applyFontFaces(
  styleEl: HTMLStyleElement,
  entries: { family: string; url: string }[],
) {
  const rules = entries
    .filter((e) => e.family && e.url)
    .map(
      (e) =>
        `@font-face { font-family: '${e.family}'; src: url('${e.url}') format('${guessFontFormat(e.url)}'); font-display: swap; font-weight: 100 900; font-style: normal; }`,
    );
  styleEl.textContent = rules.join("\n");
}

export function applyGoogleFontsLink(
  linkId: string,
  families: string[],
): void {
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  if (families.length === 0) {
    if (link) link.remove();
    return;
  }
  if (!link) {
    link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = buildGoogleFontsUrl(families);
}

export function FontLoader() {
  const { data: settings } = useGetSiteSettings();

  useEffect(() => {
    const fontEn = sanitizeFontName(settings?.fontEn, "Fraunces");
    const fontAr = sanitizeFontName(settings?.fontAr, "Cairo");
    const fontEnUrl = sanitizeFontUrl(settings?.fontEnUrl);
    const fontArUrl = sanitizeFontUrl(settings?.fontArUrl);

    let styleEl = document.getElementById(CUSTOM_FONTS_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = CUSTOM_FONTS_ID;
      document.head.appendChild(styleEl);
    }
    applyFontFaces(styleEl, [
      { family: fontEn, url: fontEnUrl },
      { family: fontAr, url: fontArUrl },
    ]);

    applyGoogleFontsLink(GOOGLE_FONTS_ID, [
      fontEnUrl ? "" : fontEn,
      fontArUrl ? "" : fontAr,
    ].filter(Boolean));

    const root = document.documentElement;
    root.style.setProperty("--app-font-serif", `'${fontEn}', serif`);
    root.style.setProperty("--app-font-arabic", `'${fontAr}', sans-serif`);
  }, [settings?.fontEn, settings?.fontAr, settings?.fontEnUrl, settings?.fontArUrl]);

  return null;
}
