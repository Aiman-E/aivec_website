import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";

export function Footer() {
  const { lang, t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground py-12 mt-20">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <img src="/logo.svg" alt="AIVEC Logo" className="h-10 w-auto brightness-0 invert" />
            <span className="font-serif font-bold text-xl">
              {t("AIVEC 2026", "مؤتمر عدن الدولي")}
            </span>
          </div>
          <p className="text-primary-foreground/80 max-w-sm">
            {t(
              "Aden International Vascular & Endovascular Conference. Convened under the patronage of the Ministry of Health of Yemen.",
              "مؤتمر عدن الدولي للأوعية الدموية. يعقد تحت رعاية وزارة الصحة اليمنية."
            )}
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">{t("Quick Links", "روابط سريعة")}</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li><Link href={`/${lang}/about`} className="hover:text-white transition-colors">{t("About", "عن المؤتمر")}</Link></li>
            <li><Link href={`/${lang}/vision`} className="hover:text-white transition-colors">{t("Vision & Mission", "الرؤية والرسالة")}</Link></li>
            <li><Link href={`/${lang}/events`} className="hover:text-white transition-colors">{t("Program", "البرنامج")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">{t("Contact", "تواصل معنا")}</h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li>Saba Grand Hall, Khormaksar</li>
            <li>Aden, Yemen</li>
            <li>info@aivec.org</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/20 text-sm text-primary-foreground/60 text-center">
        © {new Date().getFullYear()} AIVEC. All rights reserved.
      </div>
    </footer>
  );
}
