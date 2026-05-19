import { useLanguage } from "@/lib/i18n";
import { Link, useLocation } from "wouter";
import { 
  useGetSiteSettings, 
  useListEvents, 
  useListNews, 
  useListSponsors, 
  useGetPage,
  useListHeroImages,
  getGetPageQueryKey,
  getGetSiteSettingsQueryKey,
  getListEventsQueryKey,
  getListNewsQueryKey,
  getListSponsorsQueryKey,
  getListHeroImagesQueryKey
} from "@workspace/api-client-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale";
import { ArrowRight, ArrowLeft, Calendar, MapPin, ArrowUpRight, Phone, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { resolveImageUrl } from "@/components/admin/ImageUploadField";

export function Home() {
  const { lang, t } = useLanguage();
  const Arrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  const isRtl = lang === 'ar';
  const [, setLocation] = useLocation();

  const { data: settings } = useGetSiteSettings({ query: { queryKey: getGetSiteSettingsQueryKey() } as never });
  const { data: events } = useListEvents(undefined, { query: { queryKey: getListEventsQueryKey() } as never });
  const { data: news } = useListNews(undefined, { query: { queryKey: getListNewsQueryKey() } as never });
  const { data: sponsors } = useListSponsors({ query: { queryKey: getListSponsorsQueryKey() } as never });
  const { data: heroImagesData } = useListHeroImages({ query: { queryKey: getListHeroImagesQueryKey() } as never });
  const heroImages = (heroImagesData?.filter(h => h.active) ?? []).map(h => resolveImageUrl(h.url));
  const DEFAULT_HERO_SLIDES = [
    "/hero-anatomy.png",
    "/hero-vascular.png",
    "/hero-aden.png",
    "/surgical-tools.png",
    "/stent-macro.png",
    "/or-atmosphere.png",
  ];
  const slides = heroImages.length > 0 ? heroImages : DEFAULT_HERO_SLIDES;
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setSlideIndex(i => (i + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);
  
  const { data: pageAbout } = useGetPage('about', { query: { queryKey: getGetPageQueryKey('about') } as never });
  const { data: pageVision } = useGetPage('vision', { query: { queryKey: getGetPageQueryKey('vision') } as never });
  const { data: pageAudience } = useGetPage('audience', { query: { queryKey: getGetPageQueryKey('audience') } as never });
  const { data: pageSponsorship } = useGetPage('sponsorship', { query: { queryKey: getGetPageQueryKey('sponsorship') } as never });

  // Parallax logic
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Handle anchor links — supports both window.location.hash and a target
  // queued in sessionStorage by the navbar when jumping from another route.
  // Polls briefly so async-loaded sections (events/news) have time to render.
  useEffect(() => {
    const queued = sessionStorage.getItem("aivec_scroll_to");
    const target = queued || window.location.hash;
    if (!target) return;
    sessionStorage.removeItem("aivec_scroll_to");
    let attempts = 0;
    const tryScroll = () => {
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else if (attempts < 20) {
        attempts += 1;
        setTimeout(tryScroll, 150);
      }
    };
    setTimeout(tryScroll, 100);
  }, []);

  const openEvents = events?.filter(e => e.status === 'open' || e.status === 'coming_soon') || [];

  return (
    <div className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground" ref={containerRef}>
      
      {/* HERO SECTION - FULL-BLEED BACKGROUND SLIDESHOW */}
      <section id="home" className="relative min-h-[100dvh] pt-28 lg:pt-32 pb-16 overflow-hidden flex flex-col justify-center">
        {/* Background slideshow */}
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: yHero, opacity: opacityHero }}
        >
          <AnimatePresence>
            <motion.div
              key={slides[slideIndex]}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1.0 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.6, ease: "easeInOut" }, scale: { duration: 6, ease: "linear" } }}
              className="absolute inset-0"
            >
              <img
                src={slides[slideIndex]}
                alt=""
                className="w-full h-full object-cover object-center"
              />
            </motion.div>
          </AnimatePresence>
          {/* Editorial wash to keep typography legible */}
          <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/40 rtl:from-background/40 rtl:to-background/60" />
        </motion.div>

        <div className="container mx-auto px-6 md:px-12 relative z-10 flex-1 flex flex-col justify-center">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-primary w-12" />
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-primary">
                  {settings ? t(settings.conferenceOrdinalEn, settings.conferenceOrdinalAr) : "2nd"} {t("Edition", "النسخة")}
                </span>
              </div>

              <h1 className="text-[13vw] sm:text-[9vw] lg:text-[8rem] leading-[0.9] rtl:leading-[1.15] font-serif rtl:font-arabic font-bold text-foreground mb-8 tracking-tighter rtl:tracking-normal drop-shadow-sm">
                {t("Aden Intl.", "مؤتمر عدن")}<br />
                <span className="text-primary italic rtl:not-italic font-light ml-[6%] sm:ml-[10%] rtl:ml-0 rtl:mr-[4%] sm:rtl:mr-[8%] inline-block">
                  {t("Vascular", "الدولي")}
                </span><br />
                {t("Conference", "للأوعية الدموية")}
              </h1>

              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mt-10 lg:mt-14 max-w-2xl border-t border-border/50 pt-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                    {t("Date & Time", "الزمان")}
                  </p>
                  <p className="text-lg font-serif">
                    {settings ? t(settings.conferenceDatesEn, settings.conferenceDatesAr) : "Dec 1–3, 2026"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                    {t("Location", "المكان")}
                  </p>
                  <p className="text-lg font-serif">
                    {settings ? t(settings.venueNameEn, settings.venueNameAr) : "Saba Grand Hall, Aden"}
                  </p>
                </div>
              </div>

              <div className="mt-10 lg:mt-12 flex flex-wrap gap-4 sm:gap-6 items-center">
                {settings?.heroCtaFormSlug ? (
                  <Link
                    href={`/${lang}/forms/${settings.heroCtaFormSlug}`}
                    className="group flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all border border-primary relative overflow-hidden w-full sm:w-auto shadow-lg"
                  >
                    <span className="relative z-10">
                      {t(
                        settings.heroCtaLabelEn || "Join the Conference",
                        settings.heroCtaLabelAr || "انضم إلى المؤتمر",
                      )}
                    </span>
                    <ArrowRight className={`w-4 h-4 ml-4 relative z-10 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 ml-0 mr-4 group-hover:-translate-x-1' : ''}`} />
                  </Link>
                ) : (
                  <button
                    onClick={() => document.querySelector('#program')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-all border border-primary relative overflow-hidden w-full sm:w-auto shadow-lg"
                  >
                    <span className="relative z-10">{t("Explore Program", "استعرض البرنامج")}</span>
                    <ArrowRight className={`w-4 h-4 ml-4 relative z-10 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 ml-0 mr-4 group-hover:-translate-x-1' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 bg-background/60 backdrop-blur-md text-foreground font-bold text-xs uppercase tracking-widest hover:bg-background transition-all border border-border relative overflow-hidden w-full sm:w-auto"
                >
                  <span className="relative z-10">{t("Contact Us", "تواصل معنا")}</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Slide indicator dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === slideIndex ? "true" : undefined}
                onClick={() => setSlideIndex(i)}
                className={`h-1 transition-all duration-500 ${
                  i === slideIndex ? "w-10 bg-primary" : "w-5 bg-foreground/30 hover:bg-foreground/60"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* HORIZONTAL STATS BANNER */}
      <section className="border-y border-border/50 bg-card py-16 overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 flex flex-wrap justify-between items-center gap-12 font-serif text-center md:text-left rtl:md:text-right">
          {([
            { value: settings?.statEditions ?? "02", label: t("Editions", "النسخ") },
            { value: settings?.statDelegates ?? "500+", label: t("Delegates", "المشاركون") },
            { value: settings?.statFaculty ?? "35", label: t("Faculty", "المتحدثون") },
            { value: settings?.statCmeHours ?? "12", label: t("CME Hours", "ساعات معتمدة") },
            { value: settings?.statCountries ?? "4", label: t("Countries", "الدول") },
          ]).map((stat, i) => {
            // Render the trailing '+' (or other non-digit suffix) at a
            // smaller scale to preserve the editorial typography.
            const m = stat.value.match(/^([\d.,]*)(.*)$/);
            const main = m?.[1] || stat.value;
            const suffix = m?.[2] || "";
            return (
              <div key={i} className="flex-1 min-w-[150px]">
                <div className="text-6xl md:text-7xl font-light text-primary mb-2 font-mono tracking-tighter">
                  {main}
                  {suffix && <span className="text-4xl text-primary/60">{suffix}</span>}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ABOUT - EDITORIAL SPREAD */}
      {pageAbout && (
        <section id="about" className="py-16 md:py-32 lg:py-40 relative">
          <div className="container mx-auto px-6 md:px-12">
            <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
              
              <div className="lg:col-span-5 relative">
                <div className="sticky top-32">
                  <div className="aspect-[3/4] relative z-10 p-2 bg-card border border-border/50 shadow-xl overflow-hidden">
                    <motion.img 
                      initial={{ scale: 1.1 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 1.5 }}
                      viewport={{ once: true }}
                      src="/tools-editorial.png" alt="Editorial Tools" className="w-full h-full object-cover grayscale contrast-125" 
                    />
                  </div>
                  <div className="absolute -bottom-12 -right-12 w-2/3 aspect-square bg-muted border border-border/50 p-2 z-20 hidden md:block shadow-2xl">
                    <img src="/stent-macro.png" alt="Stent Macro" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 pt-12 lg:pt-0">
                <h3 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-8 flex items-center gap-4">
                  <span className="w-12 h-px bg-accent block"></span>
                  {t("The Congress", "عن المؤتمر")}
                </h3>
                <h2 className="text-5xl md:text-6xl font-serif font-bold mb-10 leading-[1.1] text-foreground">
                  {t(pageAbout.titleEn, pageAbout.titleAr)}
                </h2>
                
                {pageAbout.subtitleEn && (
                  <p className="text-2xl md:text-3xl text-primary font-serif italic mb-12 border-l-4 border-accent pl-8 rtl:pl-0 rtl:border-l-0 rtl:border-r-4 rtl:pr-8 py-2">
                    {t(pageAbout.subtitleEn, pageAbout.subtitleAr)}
                  </p>
                )}
                
                <div className="prose prose-xl dark:prose-invert prose-p:text-muted-foreground max-w-none prose-headings:font-serif">
                  {t(pageAbout.bodyEn, pageAbout.bodyAr)?.split('\n\n').map((p, i) => (
                    <p key={i} className={i === 0 ? "first-letter:text-7xl first-letter:font-serif first-letter:text-primary first-letter:float-left first-letter:mr-4 rtl:first-letter:float-right rtl:first-letter:mr-0 rtl:first-letter:ml-4 first-letter:mt-2 first-letter:leading-none" : "leading-relaxed"}>
                      {p}
                    </p>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* VISION & AUDIENCE - PARALLAX BACKGROUND */}
      <section id="vision" className="py-20 md:py-32 lg:py-48 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img src="/texture-ultrasound.png" alt="Texture" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary via-primary/90 to-primary"></div>
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 md:gap-20 lg:gap-32">
            {pageVision && (
              <div>
                <h3 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-8 flex items-center gap-4">
                  <span className="w-12 h-px bg-accent block"></span>
                  {t("Our Vision", "رؤيتنا")}
                </h3>
                <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 md:mb-10 leading-tight text-white">
                  {t(pageVision.titleEn, pageVision.titleAr)}
                </h2>
                <div className="prose prose-xl prose-invert max-w-none prose-p:text-white/80 prose-p:leading-relaxed">
                  {t(pageVision.bodyEn, pageVision.bodyAr)}
                </div>
              </div>
            )}
            {pageAudience && (
              <div id="audience" className="md:pt-32">
                <h3 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-8 flex items-center gap-4">
                  <span className="w-12 h-px bg-accent block"></span>
                  {t("Who Should Attend", "الجمهور المستهدف")}
                </h3>
                <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8 md:mb-10 leading-tight text-white">
                  {t(pageAudience.titleEn, pageAudience.titleAr)}
                </h2>
                <div className="prose prose-xl prose-invert max-w-none prose-p:text-white/80 prose-p:leading-relaxed">
                  {t(pageAudience.bodyEn, pageAudience.bodyAr)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PROGRAM - EDITORIAL TIMETABLE */}
      <section id="program" className="py-16 md:py-32 lg:py-40 bg-card">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-3xl">
              <h3 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-6 flex items-center gap-4">
                <span className="w-12 h-px bg-accent block"></span>
                {t("Scientific Program", "البرنامج العلمي")}
              </h3>
              <h2 className="text-5xl md:text-7xl font-serif font-bold leading-[0.9] tracking-tighter">
                {t("Agenda & Sessions", "الجلسات والبرنامج")}
              </h2>
            </div>
            <a href="#contact" className="text-sm font-bold uppercase tracking-widest text-primary hover:text-accent transition-colors flex items-center gap-2 pb-2">
              {t("Inquire about sessions", "استفسر عن الجلسات")}
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </a>
          </div>

          <div className="border-t-2 border-border">
            {openEvents && openEvents.length > 0 ? (
              openEvents.map((event, i) => (
                <Link key={event.id} href={`/${lang}/events/${event.slug}`} className="group block border-b border-border/50 hover:bg-background transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="grid md:grid-cols-12 gap-8 py-10 items-center px-4 md:px-8">
                    <div className="md:col-span-2 text-sm font-mono text-muted-foreground uppercase tracking-widest flex flex-col gap-2 border-l-2 border-primary/20 pl-4 rtl:pl-0 rtl:border-l-0 rtl:border-r-2 rtl:pr-4">
                      {event.startsAt && (
                        <>
                          <span className="font-bold text-primary">{format(new Date(event.startsAt), "MMM d", isRtl ? { locale: arLocale } : undefined)}</span>
                          <span dir="ltr">{format(new Date(event.startsAt), "HH:mm")}</span>
                        </>
                      )}
                    </div>
                    <div className="md:col-span-8">
                      <div className="flex gap-4 items-center mb-3">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-muted text-muted-foreground`}>
                          {event.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-3xl font-serif font-bold mb-3 group-hover:text-primary transition-colors leading-tight">
                        {t(event.titleEn, event.titleAr)}
                      </h4>
                      <p className="text-xl text-muted-foreground font-serif italic line-clamp-2">
                        {t(event.summaryEn, event.summaryAr)}
                      </p>
                    </div>
                    <div className="md:col-span-2 flex justify-end items-center">
                      <span className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 transform group-hover:scale-110">
                        <ArrowUpRight className={`w-5 h-5 ${isRtl ? '-scale-x-100' : ''}`} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-32 text-center border-b border-border/50">
                <p className="text-2xl font-serif text-muted-foreground italic">{t("The scientific program is currently being finalized.", "جاري الانتهاء من إعداد البرنامج العلمي.")}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FULL WIDTH IMAGE / PORTRAIT */}
      <section className="h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.div style={{ y: useTransform(scrollYProgress, [0.5, 1], ["-20%", "20%"]) }} className="w-full h-[140%] -top-[20%] relative">
            <img src="/faculty-portrait.png" alt="Faculty" className="w-full h-full object-cover object-top grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          </motion.div>
        </div>
        <div className="container mx-auto px-6 md:px-12 relative z-10 h-full flex items-end pb-20">
          <h2 className="text-4xl md:text-6xl lg:text-8xl font-serif font-bold text-white max-w-5xl leading-[0.9] tracking-tighter">
            {t(
              "“Advancing vascular care through global collaboration.”",
              "«النهوض برعاية الأوعية الدموية عبر التعاون الدولي.»"
            )}
          </h2>
        </div>
      </section>

      {/* NEWS SECTION */}
      <section id="news" className="py-16 md:py-32 lg:py-40 bg-background">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8 border-b-2 border-border pb-10">
            <div>
              <h3 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-6 flex items-center gap-4">
                <span className="w-12 h-px bg-accent block"></span>
                {t("Latest Updates", "أحدث التحديثات")}
              </h3>
              <h2 className="text-5xl md:text-6xl font-serif font-bold leading-tight">
                {t("Conference News", "أخبار المؤتمر")}
              </h2>
            </div>
            <a href="#contact" className="text-sm font-bold uppercase tracking-widest text-primary hover:text-accent transition-colors flex items-center gap-2">
              {t("Press inquiries", "استفسارات صحفية")}
              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            </a>
          </div>

          <div className="grid md:grid-cols-12 gap-x-10 gap-y-16">
            {news?.slice(0, 3).map((item, i) => {
              const isLead = i === 0;
              return (
                <article key={item.id} className={`${isLead ? 'md:col-span-12 lg:col-span-7 lg:border-r lg:pr-10' : i === 1 ? 'md:col-span-6 lg:col-span-5' : 'md:col-span-6 lg:col-span-5 lg:col-start-8 lg:pt-10 lg:border-t lg:border-border/60'} border-border/60`}>
                  <Link href={`/${lang}/news/${item.slug}`} className="group block h-full">
                    {isLead && item.coverUrl ? (
                      <div className="aspect-[16/10] mb-10 overflow-hidden bg-muted relative">
                        <img src={item.coverUrl} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                      </div>
                    ) : null}
                    <div className="flex items-baseline gap-6 mb-6">
                      <span className="font-mono text-[10px] tracking-[0.3em] text-accent font-bold uppercase">
                        № {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                        {item.publishedAt ? format(new Date(item.publishedAt), "MMMM d, yyyy", isRtl ? { locale: arLocale } : undefined) : ""}
                      </span>
                    </div>
                    <h4 className={`${isLead ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-2xl md:text-3xl'} font-serif font-bold mb-5 leading-[1.05] tracking-tight group-hover:text-primary transition-colors`}>
                      {t(item.titleEn, item.titleAr)}
                    </h4>
                    <p className={`text-muted-foreground ${isLead ? 'text-xl' : 'text-base'} font-serif italic leading-relaxed line-clamp-3 max-w-prose`}>
                      {t(item.excerptEn, item.excerptAr)}
                    </p>
                    <div className="mt-8 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-primary border-b border-primary/30 pb-1 group-hover:border-primary transition-colors">
                      {t("Read article", "اقرأ المقال")}
                      <Arrow className="w-3.5 h-3.5" />
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* SPONSORSHIP - MUSEUM WALL */}
      <section id="sponsors" className="py-16 md:py-32 lg:py-40 border-t border-border bg-card">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h3 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-6 flex items-center justify-center gap-4">
            <span className="w-12 h-px bg-accent block"></span>
            {t("Industry Partners", "شركاء الصناعة")}
            <span className="w-12 h-px bg-accent block"></span>
          </h3>
          <h2 className="text-5xl md:text-6xl font-serif font-bold mb-24 leading-tight max-w-3xl mx-auto">
            {t("Supported by Leading Medical Innovations", "بدعم من رواد الابتكار الطبي")}
          </h2>

          <div className="max-w-5xl mx-auto">
            {['platinum', 'gold', 'silver', 'supporter'].map(tier => {
              const tierSponsors = sponsors?.filter(s => s.tier === tier) || [];
              if (tierSponsors.length === 0) return null;
              
              return (
                <div key={tier} className="mb-24 last:mb-0">
                  <h4 className="text-sm font-bold uppercase tracking-[0.4em] text-primary mb-12 border-b border-border pb-6">
                    {t(tier + " Sponsors", "رعاة " + tier)}
                  </h4>
                  <div className={`flex flex-wrap justify-center items-center gap-16 md:gap-24 ${tier === 'platinum' ? 'mb-8' : ''}`}>
                    {tierSponsors.map(sponsor => (
                      <a 
                        key={sponsor.id} 
                        href={sponsor.websiteUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`grayscale hover:grayscale-0 transition-all duration-700 opacity-60 hover:opacity-100 ${
                          tier === 'platinum' ? 'w-56 md:w-80' : 
                          tier === 'gold' ? 'w-40 md:w-56' : 
                          'w-28 md:w-40'
                        }`}
                      >
                        {sponsor.logoUrl ? (
                          <img src={resolveImageUrl(sponsor.logoUrl)} alt={t(sponsor.nameEn, sponsor.nameAr)} className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal" />
                        ) : (
                          <div className={`font-serif font-bold ${tier === 'platinum' ? 'text-4xl' : 'text-2xl'}`}>
                            {t(sponsor.nameEn, sponsor.nameAr)}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* VENUE & CONTACT */}
      <section id="venue" className="py-16 md:py-32 lg:py-40 bg-background relative border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div id="contact" className="grid lg:grid-cols-2 gap-0 border border-border shadow-2xl bg-card">
            
            <div className="p-12 md:p-20 flex flex-col justify-center order-2 lg:order-1">
              <h3 className="text-accent font-bold uppercase tracking-[0.2em] text-sm mb-8 flex items-center gap-4">
                <span className="w-12 h-px bg-accent block"></span>
                {t("Venue & Contact", "المكان والتواصل")}
              </h3>
              <h2 className="text-4xl md:text-5xl font-serif font-bold mb-10 leading-tight">
                {settings ? t(settings.venueNameEn, settings.venueNameAr) : "Saba Grand Hall"}
              </h2>
              
              <div className="space-y-8 mb-16 text-lg font-serif">
                <div className="flex gap-6">
                  <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <p className="text-foreground leading-relaxed">{settings ? t(settings.venueDescEn, settings.venueDescAr) : "Khormaksar, Aden, Yemen"}</p>
                </div>
                <div className="flex items-center gap-6">
                  <Phone className="w-6 h-6 text-primary shrink-0" />
                  <p className="font-mono text-foreground tracking-wide" dir="ltr">{settings?.contactPhone || "+967 777 907 147"}</p>
                </div>
                <div className="flex items-center gap-6">
                  <Mail className="w-6 h-6 text-primary shrink-0" />
                  <p className="font-mono text-foreground tracking-wide">alameriendo@gmail.com</p>
                </div>
              </div>
              
              <div className="pt-10 border-t border-border/50">
                <a href="#home" className="inline-flex items-center justify-center px-8 py-4 bg-foreground text-background font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors">
                  {t("Back to Top", "العودة للأعلى")}
                  <ArrowRight className={`w-4 h-4 ml-4 ${isRtl ? 'rotate-180 ml-0 mr-4' : ''}`} />
                </a>
              </div>
            </div>
            
            <div className="relative min-h-[320px] sm:min-h-[420px] lg:min-h-full bg-muted border-b lg:border-b-0 lg:border-l border-border order-1 lg:order-2 overflow-hidden">
              <img src="/aden-landscape.png" alt="Aden Landscape" className="absolute inset-0 w-full h-full object-cover grayscale contrast-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
            </div>
            
          </div>
        </div>
      </section>

    </div>
  );
}