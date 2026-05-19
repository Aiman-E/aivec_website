import { useLanguage, useNavigateToSection } from "@/lib/i18n";
import { useGetBlog, getGetBlogQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function BlogDetail() {
  const { lang, t } = useLanguage();
  const goToSection = useNavigateToSection();
  const [, params] = useRoute("/:lang/blog/:slug");
  const slug = params?.slug || "";
  
  const { data: post, isLoading } = useGetBlog(slug, {
    query: { enabled: !!slug, queryKey: getGetBlogQueryKey(slug) } as never
  });

  const Arrow = lang === 'ar' ? ArrowRight : ArrowLeft;

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-32 max-w-4xl">
        <Skeleton className="h-4 w-32 mb-12" />
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-20 w-full mb-8" />
        <Skeleton className="h-96 w-full mb-12" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto px-6 py-40 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-serif text-muted-foreground mb-8">
          {t("Article not found.", "المقال غير موجود.")}
        </h1>
        <button
          type="button"
          onClick={() => goToSection("#home")}
          className="text-primary font-bold hover:text-accent transition-colors uppercase tracking-[0.2em] text-xs"
        >
          {t("Back to Home", "العودة للرئيسية")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-32 pt-28">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl pt-16 pb-12">
        <button
          type="button"
          onClick={() => goToSection("#home")}
          className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em]"
        >
          <Arrow className="w-4 h-4 mr-3 rtl:ml-3 rtl:mr-0" />
          {t("Back to Home", "العودة للرئيسية")}
        </button>
      </div>
      
      <article className="container mx-auto px-6 md:px-12 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mb-10 font-mono text-xs uppercase tracking-widest border-b border-border/50 pb-6">
            <span className="text-accent font-bold">
              {post.authorName || t("Editorial", "افتتاحية")}
            </span>
            <span className="w-1 h-1 rounded-full bg-border hidden sm:block"></span>
            <time className="text-muted-foreground font-bold" dateTime={post.publishedAt || undefined}>
              {post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : ""}
            </time>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-12 leading-[0.9] tracking-tighter">
            {t(post.titleEn, post.titleAr)}
          </h1>
          
          {(post.excerptEn || post.excerptAr) && (
            <p className="text-2xl md:text-3xl text-primary font-serif italic mb-12 leading-relaxed border-l-4 border-accent pl-8 rtl:pl-0 rtl:border-l-0 rtl:border-r-4 rtl:pr-8 py-2">
              {t(post.excerptEn, post.excerptAr)}
            </p>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-16">
              {post.tags.map(tag => (
                <span key={tag} className="border border-border bg-muted px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {post.coverUrl && (
            <div className="mb-20 border border-border bg-card p-3 shadow-2xl">
              <img src={post.coverUrl} alt="" className="w-full h-auto object-cover max-h-[700px] filter contrast-125 grayscale hover:grayscale-0 transition-all duration-1000" />
            </div>
          )}

          <div className="prose prose-xl md:prose-2xl dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-a:text-accent hover:prose-a:text-primary transition-colors prose-p:leading-relaxed prose-p:text-muted-foreground">
            <div className="whitespace-pre-wrap">
              {t(post.bodyEn, post.bodyAr)?.split('\n\n').map((p, i) => (
                <p key={i} className={i === 0 && !post.coverUrl ? "first-letter:text-7xl first-letter:font-serif first-letter:text-primary first-letter:float-left first-letter:mr-4 rtl:first-letter:float-right rtl:first-letter:mr-0 rtl:first-letter:ml-4 first-letter:mt-2 first-letter:leading-none" : ""}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      </article>
    </div>
  );
}