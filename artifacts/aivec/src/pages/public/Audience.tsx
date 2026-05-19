import { useLanguage } from "@/lib/i18n";
import { useGetPage } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function Audience() {
  const { lang, t } = useLanguage();
  const { data: page, isLoading } = useGetPage("audience");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <section className="relative py-20 lg:py-32 border-b border-border/10">
        <div className="absolute inset-0 bg-secondary/5"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[2px] bg-secondary"></span>
              <span className="text-secondary font-bold uppercase tracking-widest text-sm">
                {t("Attendees", "الحضور")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6">
              {t(page?.titleEn, page?.titleAr) || t("Who Should Attend", "الجمهور المستهدف")}
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
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
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
          )}
        </div>
      </section>
    </div>
  );
}
