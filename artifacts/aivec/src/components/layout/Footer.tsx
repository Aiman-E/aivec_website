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
  const contactEmails =
    settings?.contactEmails && settings.contactEmails.length > 0
      ? settings.contactEmails
      : ["alameriendo@gmail.com"];
  const contactPhones =
    settings?.contactPhones && settings.contactPhones.length > 0
      ? settings.contactPhones
      : (() => {
          const legacy: { number: string; whatsapp: boolean }[] = [];
          const phone = settings?.contactPhone?.trim();
          const wa = settings?.contactWhatsapp?.trim();
          if (phone) legacy.push({ number: phone, whatsapp: !!wa && wa === phone });
          if (wa && wa !== phone) legacy.push({ number: wa, whatsapp: true });
          return legacy.length > 0 ? legacy : [{ number: "+967 777 907 147", whatsapp: true }];
        })();

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
              <li className="pt-4 space-y-2" dir="ltr">
                {contactPhones.map((phone, index) => {
                  const normalizedPhone = phone.number.replace(/\s+/g, "");
                  const whatsappDigits = phone.number.replace(/[^\d]/g, "");
                  return (
                    <div key={`${phone.number}-${index}`} className="flex items-center gap-2">
                      <a
                        href={`tel:${normalizedPhone}`}
                        className="font-mono text-sm tracking-widest hover:text-primary transition-colors"
                      >
                        {phone.number}
                      </a>
                      {phone.whatsapp && whatsappDigits && (
                        <a
                          href={`https://wa.me/${whatsappDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`WhatsApp ${phone.number}`}
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#25D366] text-white hover:opacity-90 transition-opacity"
                        >
                          <WhatsAppGlyph className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </li>
              {contactEmails.map((email) => (
                <li key={email} className="font-mono text-sm tracking-widest">
                  <a href={`mailto:${email}`} className="hover:text-primary transition-colors" dir="ltr">
                    {email}
                  </a>
                </li>
              ))}
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

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.511-5.26c.002-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
