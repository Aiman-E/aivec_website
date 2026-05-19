import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useUser } from "@clerk/react";

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { isSignedIn } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center gap-2">
          <img src="/logo.svg" alt="AIVEC Logo" className="h-8 w-auto" />
          <span className="font-serif font-bold text-lg hidden sm:inline-block">
            {t("AIVEC 2026", "مؤتمر عدن الدولي")}
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link href={`/${lang}/about`} className="hover:text-primary transition-colors">
            {t("About", "عن المؤتمر")}
          </Link>
          <Link href={`/${lang}/events`} className="hover:text-primary transition-colors">
            {t("Events", "الفعاليات")}
          </Link>
          <Link href={`/${lang}/sponsorship`} className="hover:text-primary transition-colors">
            {t("Sponsorship", "الرعاة")}
          </Link>
          <Link href={`/${lang}/contact`} className="hover:text-primary transition-colors">
            {t("Contact", "اتصل بنا")}
          </Link>
          <div className="w-px h-4 bg-border mx-2" />
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="text-muted-foreground hover:text-foreground font-semibold"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>
          {!isSignedIn && (
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">{t("Sign In", "تسجيل الدخول")}</Button>
            </SignInButton>
          )}
          {isSignedIn && (
            <>
              <UserButton />
              <Link href={`/${lang}/me/registrations`}>
                <Button variant="outline" size="sm">{t("Portal", "البوابة")}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
