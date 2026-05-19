import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useUser } from "@clerk/react";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { isSignedIn } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: `#about`, label: t("About", "عن المؤتمر") },
    { href: `#vision`, label: t("Vision", "الرؤية") },
    { href: `#program`, label: t("Program", "البرنامج") },
    { href: `#sponsors`, label: t("Sponsors", "الرعاة") },
    { href: `#news`, label: t("News", "الأخبار") },
    { href: `#venue`, label: t("Venue", "المكان") },
    { href: `#contact`, label: t("Contact", "اتصل بنا") },
  ];

  const toggleLanguage = () => {
    setLang(lang === "en" ? "ar" : "en");
  };

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (location !== `/${lang}`) {
      setLocation(`/${lang}${href}`);
    } else {
      // Wait one tick so menu close doesn't fight the scroll
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 bg-background/85 ${
          scrolled
            ? "border-border/60 py-4 shadow-sm"
            : "border-border/20 py-6"
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-4 z-50 group">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-sm overflow-hidden relative shadow-lg">
              <div className="absolute inset-0 bg-[url('/vein-abstract.png')] opacity-30 bg-cover bg-center"></div>
              <span className="text-primary-foreground font-serif font-bold text-2xl relative z-10">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg leading-none tracking-tight transition-colors text-foreground group-hover:text-accent">
                {t("AIVEC 2026", "مؤتمر عدن الدولي")}
              </span>
              <span className="text-[10px] uppercase tracking-widest font-medium mt-1 text-muted-foreground">
                {t("Vascular Conference", "جراحة الأوعية الدموية")}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors relative group text-muted-foreground"
                >
                  {link.label}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
            </div>

            <div className="w-px h-5 mx-2 bg-border/60" />

            <div className="flex items-center gap-5">
              <button
                onClick={toggleLanguage}
                className="text-xs font-bold hover:text-accent transition-colors uppercase tracking-widest text-foreground"
              >
                {lang === "en" ? "عربي" : "EN"}
              </button>

              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <Button variant="default" size="sm" className="font-bold text-xs uppercase tracking-widest px-6 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 border border-primary">
                    {t("Sign In", "دخول")}
                  </Button>
                </SignInButton>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href={`/${lang}/me/registrations`}>
                    <Button variant="outline" size="sm" className="font-bold text-xs uppercase tracking-widest rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                      {t("Portal", "البوابة")}
                    </Button>
                  </Link>
                  <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 rounded-none border border-border" } }} />
                </div>
              )}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden p-2 -mr-2 text-foreground z-[70] relative"
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu — rendered as sibling to escape navbar's backdrop-filter stacking context */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-[60] bg-background flex flex-col px-6 pt-28 pb-8 overflow-y-auto"
          >
            <div className="flex flex-col gap-2 mt-2">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.25 }}
                  onClick={() => handleNavClick(link.href)}
                  className="text-2xl font-serif text-left rtl:text-right text-foreground hover:text-accent transition-colors border-b border-border/30 py-4"
                >
                  {link.label}
                </motion.button>
              ))}
            </div>

            <div className="mt-auto pt-10 flex flex-col gap-3">
              <button
                onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
                className="w-full py-4 text-center border border-border font-bold text-sm tracking-widest uppercase hover:bg-muted transition-colors"
              >
                {lang === "en" ? "التصفح بالعربية" : "Switch to English"}
              </button>

              {!isSignedIn ? (
                <SignInButton mode="modal">
                  <Button size="lg" className="w-full rounded-none text-sm tracking-widest uppercase font-bold" onClick={() => setMobileMenuOpen(false)}>
                    {t("Sign In", "تسجيل الدخول")}
                  </Button>
                </SignInButton>
              ) : (
                <Link href={`/${lang}/me/registrations`} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="lg" className="w-full rounded-none text-sm tracking-widest uppercase font-bold border-primary text-primary">
                    {t("Delegate Portal", "بوابة المشتركين")}
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
