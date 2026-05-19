import { useLanguage } from "@/lib/i18n";
import { useGetPage, useListSponsors } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function Sponsorship() {
  const { lang, t } = useLanguage();
  const { data: page, isLoading: isLoadingPage } = useGetPage("sponsorship");
  const { data: sponsors, isLoading: isLoadingSponsors } = useListSponsors();

  const groupedSponsors = sponsors?.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) {
      acc[sponsor.tier] = [];
    }
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<string, typeof sponsors>) || {};

  const tierOrder = ["government", "platinum", "gold", "silver", "supporter"];

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="max-w-4xl mx-auto mb-16">
        {isLoadingPage ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="pt-8 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ) : (
          <div className="prose prose-lg dark:prose-invert max-w-none text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">
              {t(page?.titleEn, page?.titleAr) || t("Sponsors & Partners", "الرعاة والشركاء")}
            </h1>
            {(page?.subtitleEn || page?.subtitleAr) && (
              <p className="text-xl text-muted-foreground mb-8">
                {t(page?.subtitleEn, page?.subtitleAr)}
              </p>
            )}
            <div className="whitespace-pre-wrap text-foreground/90 text-left dark:text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {t(page?.bodyEn, page?.bodyAr)}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-16 max-w-6xl mx-auto">
        {isLoadingSponsors ? (
          <div className="flex justify-center"><Skeleton className="h-32 w-full max-w-3xl" /></div>
        ) : (
          tierOrder.map((tier) => {
            const tierSponsors = groupedSponsors[tier];
            if (!tierSponsors || tierSponsors.length === 0) return null;

            return (
              <div key={tier} className="text-center">
                <h2 className="text-2xl font-serif font-bold text-primary mb-8 uppercase tracking-widest border-b pb-4 inline-block px-8">
                  {t(tier, tier)} {t("Sponsors", "الرعاة")}
                </h2>
                <div className={`grid gap-8 justify-center ${
                  tier === 'platinum' || tier === 'government' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 
                  tier === 'gold' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 
                  'grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                }`}>
                  {tierSponsors.map((sponsor) => (
                    <Card key={sponsor.id} className="overflow-hidden bg-card hover:shadow-lg transition-shadow border-none shadow-sm flex items-center justify-center p-6 aspect-square">
                      <CardContent className="p-0 flex flex-col items-center justify-center text-center">
                        {sponsor.logoUrl ? (
                          <img src={sponsor.logoUrl} alt={t(sponsor.nameEn, sponsor.nameAr)} className="max-w-[120px] max-h-[80px] object-contain mb-4 filter grayscale dark:invert opacity-70 hover:filter-none hover:opacity-100 transition-all" />
                        ) : (
                          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground font-serif text-xl">
                            {t(sponsor.nameEn, sponsor.nameAr).charAt(0)}
                          </div>
                        )}
                        <h3 className="font-medium text-foreground">{t(sponsor.nameEn, sponsor.nameAr)}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
