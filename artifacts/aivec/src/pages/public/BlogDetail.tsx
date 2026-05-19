import { useLanguage } from "@/lib/i18n";
import { useGetBlog } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function BlogDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/:lang/blog/:slug");
  const slug = params?.slug || "";
  
  const { data: post, isLoading } = useGetBlog(slug, {
    query: { enabled: !!slug } as never
  });

  const Arrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-3xl">
        <Skeleton className="h-4 w-32 mb-12" />
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-16 w-full mb-8" />
        <Skeleton className="h-96 w-full mb-12" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-serif text-muted-foreground mb-6">
          {t("Article not found.", "المقال غير موجود.")}
        </h1>
        <Link href={`/${lang}/blog`} className="text-primary font-bold hover:underline uppercase tracking-wider text-sm">
          {t("Back to Articles", "العودة للمقالات")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl pt-12 pb-8">
        <Link href={`/${lang}/blog`} className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider">
          <Arrow className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {t("All Articles", "كل المقالات")}
        </Link>
      </div>
      
      <article className="container mx-auto px-4 md:px-8 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
            <span className="text-accent font-bold uppercase tracking-widest text-sm">
              {post.authorName || t("Editorial", "افتتاحية")}
            </span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground hidden sm:block"></span>
            <time className="text-muted-foreground text-sm font-medium" dateTime={post.publishedAt || undefined}>
              {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : ""}
            </time>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-8 leading-tight">
            {t(post.titleEn, post.titleAr)}
          </h1>
          
          {(post.excerptEn || post.excerptAr) && (
            <p className="text-xl md:text-2xl text-muted-foreground font-serif italic mb-10 leading-relaxed">
              {t(post.excerptEn, post.excerptAr)}
            </p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12">
              {post.tags.map(tag => (
                <span key={tag} className="border border-border/60 bg-muted/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {post.coverUrl && (
            <div className="mb-16 border border-border/50 bg-muted">
              <img src={post.coverUrl} alt="" className="w-full h-auto object-cover max-h-[600px]" />
            </div>
          )}

          <div className="prose prose-lg md:prose-xl dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-a:text-accent prose-p:leading-relaxed">
            <div className="whitespace-pre-wrap">
              {t(post.bodyEn, post.bodyAr)}
            </div>
          </div>
        </motion.div>
      </article>
    </div>
  );
}
