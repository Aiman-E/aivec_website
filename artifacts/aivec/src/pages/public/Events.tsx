import { useLanguage, useDateLocale } from "@/lib/i18n";
import { useListEvents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, MapPin, Clock, ArrowRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export function Events() {
  const { lang, t, tStatus } = useLanguage();
  const dateLocale = useDateLocale();
  const { data: events, isLoading } = useListEvents();
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <section className="relative py-20 lg:py-32 border-b border-border/10 bg-card">
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[2px] bg-primary"></span>
              <span className="text-primary font-bold uppercase tracking-widest text-sm">
                {t("Agenda", "الأجندة")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
              {t("Scientific Program", "البرنامج العلمي")}
            </h1>
            
            <p className="text-xl text-muted-foreground">
              {t("Explore our schedule of sessions, workshops, and keynote presentations.", "استكشف جدول الجلسات وورش العمل والعروض الرئيسية.")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 md:px-8 max-w-5xl">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="border border-border p-6 flex flex-col md:flex-row gap-6">
                  <div className="md:w-48 shrink-0">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="space-y-6">
              {events.map((event, i) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Link href={`/${lang}/events/${event.slug}`}>
                    <div className="group border border-border bg-background hover:border-primary/50 transition-colors p-6 md:p-8 cursor-pointer relative overflow-hidden flex flex-col md:flex-row gap-6 md:gap-12">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary transition-colors"></div>
                      
                      <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r md:rtl:border-l md:rtl:border-r-0 border-border/50 pb-4 md:pb-0 md:pr-8 md:rtl:pr-0 md:rtl:pl-8">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-primary font-bold">
                            <Clock className="w-4 h-4" />
                            <span>
                              {event.startsAt ? format(new Date(event.startsAt), "h:mm a", { locale: dateLocale }) : t("TBA", "يحدد لاحقاً")}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground font-medium">
                            {event.startsAt ? format(new Date(event.startsAt), "MMMM d, yyyy", { locale: dateLocale }) : ""}
                          </div>
                          
                          <div className="mt-2">
                            <span className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-sm ${
                              event.status === 'open' ? 'bg-secondary/10 text-secondary' :
                              event.status === 'coming_soon' ? 'bg-accent/10 text-accent' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {tStatus(event.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-2xl font-serif font-bold mb-3 group-hover:text-primary transition-colors">
                          {t(event.titleEn, event.titleAr)}
                        </h3>
                        
                        <p className="text-muted-foreground mb-6 line-clamp-3">
                          {t(event.summaryEn, event.summaryAr)}
                        </p>
                        
                        <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{t(event.venueEn, event.venueAr) || t("Main Hall", "القاعة الرئيسية")}</span>
                          </div>
                          
                          <div className="flex items-center text-sm font-bold text-primary group-hover:text-accent transition-colors">
                            {t("View Details", "التفاصيل")}
                            <Arrow className="ml-2 w-4 h-4 rtl:ml-0 rtl:mr-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border bg-muted/20">
              <p className="text-xl text-muted-foreground font-serif italic">
                {t("The scientific program is being finalized. Please check back soon.", "جاري استكمال البرنامج العلمي. يرجى التحقق قريباً.")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
