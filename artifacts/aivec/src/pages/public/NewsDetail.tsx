import { useLanguage } from "@/lib/i18n";
import { useGetNews } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function NewsDetail() {
  const { lang, t } = useLanguage();
  const [match, params] = useRoute("/:lang/news/:slug");
  const slug = params?.slug || "";
  
  const { data: news, isLoading } = useGetNews(slug, {
    query: { enabled: !!slug } as never
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/4 mb-8" />
        <Skeleton className="h-64 w-full mb-8" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif text-muted-foreground">
          {t("News not found.", "الخبر غير موجود.")}
        </h1>
        <Link href={`/${lang}/news`} className="text-primary hover:underline mt-4 inline-block">
          {t("Back to News", "العودة للأخبار")}
        </Link>
      </div>
    );
  }

  const BackIcon = lang === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href={`/${lang}/news`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <BackIcon className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Back to News", "العودة للأخبار")}
      </Link>
      
      <article className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
          {t(news.titleEn, news.titleAr)}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          {news.publishedAt && (
            <time dateTime={news.publishedAt}>
              {format(new Date(news.publishedAt), "PPP")}
            </time>
          )}
          {news.category && (
            <span className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium">
              {news.category}
            </span>
          )}
        </div>

        {news.coverUrl && (
          <div className="mb-10 rounded-lg overflow-hidden border">
            <img src={news.coverUrl} alt="" className="w-full h-auto" />
          </div>
        )}

        <div className="whitespace-pre-wrap text-foreground/90">
          {t(news.bodyEn, news.bodyAr)}
        </div>
      </article>
    </div>
  );
}
