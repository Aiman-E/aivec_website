import { useLanguage, useNavigateToSection } from "@/lib/i18n";
import { Link } from "wouter";
import { useGetSiteSettings } from "@workspace/api-client-react";

export function Footer() {
  const { lang, t } = useLanguage();
  const goToSection = useNavigateToSection();
  const { data: settings } = useGetSiteSettings();

  const navLinkClass = "text-background/80 hover:text-primary transition-colors font-bold text-sm uppercase tracking-widest";

  // Use real anchor links (preserves middle-click, copy-link, SEO, no-JS
  // fallback) but intercept the click to use the in-app section scroller
  // so the page doesn't fully reload.
  const sectionLink = (hash: string, label: string) => (
    <a
      href={`/${lang}${hash}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        goToSection(hash);
      }}
      className={navLinkClass}
    >
      {label}
    </a>
  );

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-16 md:py-24 border-t-4 border-primary">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20">
          
          <div className="md:col-span-5">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-sm overflow-hidden relative shadow-lg">
                 <span className="text-primary-foreground font-serif font-bold text-2xl relative z-10">A</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xl leading-none tracking-tight">
                  {t("AIVEC 2026", "مؤتمر عدن الدولي")}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-medium mt-1 text-muted">
                  {t("Vascular Conference", "جراحة الأوعية الدموية")}
                </span>
              </div>
            </div>
            <p className="text-background/70 font-serif italic text-lg leading-relaxed max-w-sm">
              {settings ? t(settings.footerNoteEn, settings.footerNoteAr) : t("The leading vascular and endovascular scientific congress in the Arabian Peninsula.", "المؤتمر العلمي الرائد في جراحة الأوعية الدموية في شبه الجزيرة العربية.")}
            </p>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-background/50 mb-6 font-mono">
              {t("Congress Secretariat", "سكرتارية المؤتمر")}
            </h4>
            <ul className="space-y-4 text-background/80 font-serif">
              <li>{settings ? t(settings.venueNameEn, settings.venueNameAr) : "Saba Grand Hall"}</li>
              <li>{settings ? t(settings.venueDescEn, settings.venueDescAr) : "Khormaksar, Aden, Yemen"}</li>
              <li className="pt-4 font-mono text-sm tracking-widest" dir="ltr">{settings?.contactPhone || "+967 777 907 147"}</li>
              <li className="font-mono text-sm tracking-widest">{settings?.contactEmails?.[0] || "alameriendo@gmail.com"}</li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-background/50 mb-6 font-mono">
              {t("Navigation", "روابط")}
            </h4>
            <ul className="space-y-4">
              <li>{sectionLink("#about", t("About", "عن المؤتمر"))}</li>
              <li>{sectionLink("#program", t("Program", "البرنامج"))}</li>
              <li>{sectionLink("#sponsors", t("Sponsors", "الرعاة"))}</li>
              <li>{sectionLink("#contact", t("Contact", "اتصل بنا"))}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono tracking-widest text-background/50 uppercase">
          <p>
            &copy; {currentYear} AIVEC. {t("All rights reserved.", "جميع الحقوق محفوظة.")}
          </p>
          <div className="flex gap-6">
            <Link href={`/en`} className="hover:text-background transition-colors">English</Link>
            <Link href={`/ar`} className="hover:text-background transition-colors">عربي</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}