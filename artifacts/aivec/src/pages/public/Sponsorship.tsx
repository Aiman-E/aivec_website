import { useLanguage } from "@/lib/i18n";
import { useGetPage, useListSponsors } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { resolveImageUrl } from "@/components/admin/ImageUploadField";

export function Sponsorship() {
  const { lang, t, tStatus } = useLanguage();
  const { data: page, isLoading: isLoadingPage } = useGetPage("sponsorship");
  const { data: sponsors, isLoading: isLoadingSponsors } = useListSponsors();

  const groupedSponsors = sponsors?.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) {
      acc[sponsor.tier] = [];
    }
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<string, typeof sponsors>) || {};

  const KNOWN_TIERS = ["government", "platinum", "gold", "silver", "bronze", "supporter"];
  // Render known tiers in priority order, then any unknown tiers from the DB
  // so a newly added tier still surfaces instead of being silently dropped.
  const extraTiers = Object.keys(groupedSponsors).filter(k => !KNOWN_TIERS.includes(k));
  const tierOrder = [...KNOWN_TIERS, ...extraTiers];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <section className="relative py-20 lg:py-32 border-b border-border/10">
        <div className="absolute inset-0 bg-accent/5"></div>
        
        <div className="container mx-auto px-4 md:px-8 relative z-10 text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-8 h-[2px] bg-accent"></span>
              <span className="text-accent font-bold uppercase tracking-widest text-sm">
                {t("Partners", "الشركاء")}
              </span>
              <span className="w-8 h-[2px] bg-accent"></span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-primary mb-6">
              {t(page?.titleEn, page?.titleAr) || t("Sponsors & Partners", "الرعاة والشركاء")}
            </h1>
            
            {(page?.subtitleEn || page?.subtitleAr) && (
              <p className="text-xl md:text-2xl text-muted-foreground font-serif italic mb-8">
                {t(page?.subtitleEn, page?.subtitleAr)}
              </p>
            )}
            
            {!isLoadingPage && page?.bodyEn && (
              <div className="prose prose-lg dark:prose-invert max-w-none text-left rtl:text-right mt-12 mx-auto">
                <div className="whitespace-pre-wrap">
                  {t(page?.bodyEn, page?.bodyAr)}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="space-y-24 max-w-6xl mx-auto">
            {isLoadingSponsors ? (
              <div className="flex justify-center"><Skeleton className="h-64 w-full max-w-4xl" /></div>
            ) : (
              tierOrder.map((tier) => {
                const tierSponsors = groupedSponsors[tier];
                if (!tierSponsors || tierSponsors.length === 0) return null;

                return (
                  <motion.div 
                    key={tier} 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="flex items-center justify-center gap-4 mb-12">
                      <div className="h-px bg-border flex-1 max-w-[100px]"></div>
                      <h2 className="text-2xl font-serif font-bold text-primary uppercase tracking-widest">
                        {tStatus(tier)} {t("Sponsors", "الرعاة")}
                      </h2>
                      <div className="h-px bg-border flex-1 max-w-[100px]"></div>
                    </div>
                    
                    <div className={`flex flex-wrap justify-center gap-8 md:gap-12 ${
                      tier === 'platinum' || tier === 'government' ? 'max-w-4xl mx-auto' : 
                      'max-w-5xl mx-auto'
                    }`}>
                      {tierSponsors.map((sponsor) => (
                        <div key={sponsor.id} className="group flex flex-col items-center justify-center">
                          {sponsor.logoUrl ? (
                            <div className={`bg-white p-6 md:p-8 rounded-sm shadow-sm border border-border/50 transition-all duration-300 hover:shadow-md hover:border-primary/30 flex items-center justify-center ${
                              tier === 'government' || tier === 'platinum' ? 'w-48 h-48 md:w-64 md:h-64' :
                              tier === 'gold' ? 'w-40 h-40 md:w-48 md:h-48' :
                              'w-32 h-32 md:w-40 md:h-40'
                            }`}>
                              <img 
                                src={resolveImageUrl(sponsor.logoUrl)} 
                                alt={t(sponsor.nameEn, sponsor.nameAr)} 
                                className="max-w-[80%] max-h-[80%] object-contain filter grayscale opacity-70 group-hover:filter-none group-hover:opacity-100 transition-all duration-500" 
                              />
                            </div>
                          ) : (
                            <div className={`bg-card p-6 rounded-sm shadow-sm border border-border/50 flex flex-col items-center justify-center ${
                              tier === 'government' || tier === 'platinum' ? 'w-48 h-48 md:w-64 md:h-64' :
                              tier === 'gold' ? 'w-40 h-40 md:w-48 md:h-48' :
                              'w-32 h-32 md:w-40 md:h-40'
                            }`}>
                              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground font-serif text-2xl group-hover:text-primary transition-colors">
                                {t(sponsor.nameEn, sponsor.nameAr).charAt(0)}
                              </div>
                              <h3 className="font-medium text-foreground text-center line-clamp-2 px-2 group-hover:text-primary transition-colors">
                                {t(sponsor.nameEn, sponsor.nameAr)}
                              </h3>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
