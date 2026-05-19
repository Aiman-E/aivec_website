import { useLanguage } from "@/lib/i18n";
import { useGetPage } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function About() {
  const { lang, t } = useLanguage();
  const { data: page, isLoading } = useGetPage("about");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero header for the page */}
      <section className="relative py-20 lg:py-32 border-b border-border/10">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none bg-[url('/hero-vascular.png')] bg-cover bg-center"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[2px] bg-accent"></span>
              <span className="text-accent font-bold uppercase tracking-widest text-sm">
                {t("Institution", "المؤسسة")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6">
              {t(page?.titleEn, page?.titleAr) || t("About the Conference", "عن المؤتمر")}
            </h1>
            
            {(page?.subtitleEn || page?.subtitleAr) && (
              <p className="text-xl md:text-2xl text-muted-foreground font-serif italic">
                {t(page?.subtitleEn, page?.subtitleAr)}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 md:px-8">
          {isLoading ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <div className="py-8"></div>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-4/5" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
              <div className="lg:col-span-8">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-primary prose-a:text-accent prose-p:leading-relaxed"
                >
                  <div className="whitespace-pre-wrap">
                    {t(page?.bodyEn, page?.bodyAr)}
                  </div>
                </motion.div>
              </div>
              
              <div className="lg:col-span-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="border border-border bg-card p-8 sticky top-32">
                    <h3 className="font-serif text-xl font-bold mb-6 text-foreground border-b border-border/50 pb-4">
                      {t("Organizing Committee", "اللجنة المنظمة")}
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{t("Patronage", "برعاية")}</p>
                        <p className="font-medium text-primary">{t("Ministry of Public Health & Population, Yemen", "وزارة الصحة العامة والسكان، اليمن")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{t("Host", "الجهة المستضيفة")}</p>
                        <p className="font-medium text-primary">{t("Vascular Surgery Department", "قسم جراحة الأوعية الدموية")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">{t("Location", "الموقع")}</p>
                        <p className="font-medium text-primary">{t("Aden, Republic of Yemen", "عدن، الجمهورية اليمنية")}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
