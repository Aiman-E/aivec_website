import { useLanguage } from "@/lib/i18n";
import { useGetBlog } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function BlogDetail() {
  const { lang, t } = useLanguage();
  const [match, params] = useRoute("/:lang/blog/:slug");
  const slug = params?.slug || "";
  
  const { data: post, isLoading } = useGetBlog(slug, {
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

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif text-muted-foreground">
          {t("Article not found.", "المقال غير موجود.")}
        </h1>
        <Link href={`/${lang}/blog`} className="text-primary hover:underline mt-4 inline-block">
          {t("Back to Articles", "العودة للمقالات")}
        </Link>
      </div>
    );
  }

  const BackIcon = lang === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Link href={`/${lang}/blog`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <BackIcon className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Back to Articles", "العودة للمقالات")}
      </Link>
      
      <article className="prose prose-lg dark:prose-invert max-w-none">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
          {t(post.titleEn, post.titleAr)}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 border-b pb-4">
          {post.authorName && (
            <div className="font-medium text-foreground">
              {post.authorName}
            </div>
          )}
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {format(new Date(post.publishedAt), "PPP")}
            </time>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2">
              {post.tags.map(tag => (
                <span key={tag} className="bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {post.coverUrl && (
          <div className="mb-10 rounded-lg overflow-hidden border">
            <img src={post.coverUrl} alt="" className="w-full h-auto" />
          </div>
        )}

        <div className="whitespace-pre-wrap text-foreground/90">
          {t(post.bodyEn, post.bodyAr)}
        </div>
      </article>
    </div>
  );
}
