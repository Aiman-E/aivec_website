import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton, useUser } from "@clerk/react";
import { Menu, X, ArrowRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { lang, setLang, t } = useLanguage();
  const { isSignedIn } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: `/${lang}/about`, label: t("About", "عن المؤتمر") },
    { href: `/${lang}/vision`, label: t("Vision", "الرؤية") },
    { href: `/${lang}/events`, label: t("Program", "البرنامج") },
    { href: `/${lang}/sponsorship`, label: t("Sponsors", "الرعاة") },
    { href: `/${lang}/news`, label: t("News", "الأخبار") },
    { href: `/${lang}/contact`, label: t("Contact", "اتصل بنا") },
  ];

  const toggleLanguage = () => {
    setLang(lang === "en" ? "ar" : "en");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? "bg-background/90 backdrop-blur-md border-border/50 py-3 shadow-sm" 
          : "bg-background border-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        <Link href={`/${lang}`} className="flex items-center gap-3 z-50 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-sm overflow-hidden relative">
             <div className="absolute inset-0 bg-[url('/hero-vascular.png')] opacity-20 bg-cover bg-center"></div>
             <span className="text-primary-foreground font-serif font-bold text-xl relative z-10">A</span>
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
              {t("AIVEC 2026", "مؤتمر عدن الدولي")}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              {t("Vascular Conference", "جراحة الأوعية الدموية")}
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all group-hover:w-full"></span>
              </Link>
            ))}
          </div>

          <div className="w-px h-5 bg-border mx-2" />
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="text-sm font-bold text-foreground hover:text-primary transition-colors uppercase tracking-wider"
            >
              {lang === "en" ? "عربي" : "EN"}
            </button>
            
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <Button variant="default" size="sm" className="font-medium px-6 rounded-none">
                  {t("Sign In", "تسجيل الدخول")}
                </Button>
              </SignInButton>
            ) : (
              <div className="flex items-center gap-3">
                <Link href={`/${lang}/me/registrations`}>
                  <Button variant="outline" size="sm" className="font-medium rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
          className="lg:hidden p-2 -mr-2 text-foreground z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-0 pt-24 bg-background z-40 flex flex-col px-6 pb-6 overflow-y-auto"
            >
              <div className="flex flex-col gap-6 mt-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-2xl font-serif text-foreground hover:text-primary transition-colors border-b border-border/50 pb-4"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              
              <div className="mt-auto pt-8 flex flex-col gap-4">
                <button
                  onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }}
                  className="w-full py-4 text-center border border-border font-bold text-lg hover:bg-muted transition-colors"
                >
                  {lang === "en" ? "التصفح بالعربية" : "Switch to English"}
                </button>
                
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <Button size="lg" className="w-full rounded-none text-lg" onClick={() => setMobileMenuOpen(false)}>
                      {t("Sign In", "تسجيل الدخول")}
                    </Button>
                  </SignInButton>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Link href={`/${lang}/me/registrations`} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" size="lg" className="w-full rounded-none">
                        {t("Delegate Portal", "بوابة المشتركين")}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
