import { useLanguage } from "@/lib/i18n";
import { useGetNews } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function NewsDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/:lang/news/:slug");
  const slug = params?.slug || "";
  
  const { data: news, isLoading } = useGetNews(slug, {
    query: { enabled: !!slug } as never
  });

  const Arrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <Skeleton className="h-4 w-32 mb-12" />
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-16 w-full mb-8" />
        <Skeleton className="h-96 w-full mb-12" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-serif text-muted-foreground mb-6">
          {t("News article not found.", "الخبر غير موجود.")}
        </h1>
        <Link href={`/${lang}/news`} className="text-primary font-bold hover:underline uppercase tracking-wider text-sm">
          {t("Back to News", "العودة للأخبار")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl pt-12 pb-8">
        <Link href={`/${lang}/news`} className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
          <Arrow className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t("All News", "كل الأخبار")}
        </Link>
      </div>
      
      <article className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="text-primary font-bold uppercase tracking-widest text-sm">
              {news.category || t("News", "أخبار")}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
            <time className="text-muted-foreground text-sm font-medium" dateTime={news.publishedAt || undefined}>
              {news.publishedAt ? format(new Date(news.publishedAt), "MMMM d, yyyy") : ""}
            </time>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-8 leading-tight">
            {t(news.titleEn, news.titleAr)}
          </h1>
          
          {(news.excerptEn || news.excerptAr) && (
            <p className="text-xl md:text-2xl text-muted-foreground font-serif italic mb-12 leading-relaxed">
              {t(news.excerptEn, news.excerptAr)}
            </p>
          )}

          {news.coverUrl && (
            <div className="mb-16 border border-border/50 bg-muted">
              <img src={news.coverUrl} alt="" className="w-full h-auto object-cover max-h-[600px]" />
            </div>
          )}

          <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-a:text-primary prose-p:leading-relaxed">
            <div className="whitespace-pre-wrap">
              {t(news.bodyEn, news.bodyAr)}
            </div>
          </div>
        </motion.div>
      </article>
    </div>
  );
}
