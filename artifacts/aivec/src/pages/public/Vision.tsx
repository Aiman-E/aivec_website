import { useLanguage } from "@/lib/i18n";
import { useGetPage } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Vision() {
  const { lang, t } = useLanguage();
  const { data: page, isLoading } = useGetPage("vision");

  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      {isLoading ? (
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
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">
            {t(page?.titleEn, page?.titleAr) || t("Vision & Mission", "الرؤية والرسالة")}
          </h1>
          {(page?.subtitleEn || page?.subtitleAr) && (
            <p className="text-xl text-muted-foreground mb-8">
              {t(page?.subtitleEn, page?.subtitleAr)}
            </p>
          )}
          <div className="whitespace-pre-wrap text-foreground/90">
            {t(page?.bodyEn, page?.bodyAr)}
          </div>
        </div>
      )}
    </div>
  );
}
