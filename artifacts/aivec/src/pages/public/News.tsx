import { useLanguage } from "@/lib/i18n";
import { useListNews } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function News() {
  const { lang, t } = useLanguage();
  const { data: news, isLoading } = useListNews({ published: true });
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
                {t("Updates", "تحديثات")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
              {t("Conference News", "أخبار المؤتمر")}
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 md:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : news && news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 gap-y-16">
              {news.map((item, i) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link href={`/${lang}/news/${item.slug}`}>
                    <div className="group flex flex-col h-full cursor-pointer">
                      <div className="w-full aspect-[4/3] overflow-hidden bg-muted mb-6 relative border border-border/50">
                        {item.coverUrl ? (
                          <img 
                            src={item.coverUrl} 
                            alt="" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-card">
                            <span className="font-serif text-4xl text-muted-foreground/30 font-bold">AIVEC</span>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground">
                          {item.category || t("News", "أخبار")}
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="text-sm font-medium text-primary mb-3">
                          {item.publishedAt ? format(new Date(item.publishedAt), "MMMM d, yyyy") : ""}
                        </div>
                        
                        <h2 className="text-2xl font-serif font-bold mb-4 group-hover:text-primary transition-colors line-clamp-2">
                          {t(item.titleEn, item.titleAr)}
                        </h2>
                        
                        <p className="text-muted-foreground mb-6 line-clamp-3 leading-relaxed">
                          {t(item.excerptEn, item.excerptAr)}
                        </p>
                        
                        <div className="mt-auto flex items-center text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {t("Read Full Article", "قراءة المقال كاملاً")}
                          <Arrow className="ml-2 w-4 h-4 rtl:ml-0 rtl:mr-2 opacity-0 -translate-x-2 rtl:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 rtl:group-hover:-translate-x-0 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-border bg-muted/20 max-w-3xl mx-auto">
              <p className="text-xl text-muted-foreground font-serif italic">
                {t("No news updates are available at this time.", "لا توجد تحديثات أخبار متاحة في هذا الوقت.")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
