import { useLanguage } from "@/lib/i18n";
import { useListNews } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { format } from "date-fns";

export function News() {
  const { lang, t } = useLanguage();
  const { data: news, isLoading } = useListNews({ published: true });

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">
          {t("Latest News", "آخر الأخبار")}
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : news && news.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link key={item.id} href={`/${lang}/news/${item.slug}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                {item.coverUrl && (
                  <div className="h-48 w-full overflow-hidden bg-muted">
                    <img src={item.coverUrl} alt="" className="w-full h-full object-cover transition-transform hover:scale-105" />
                  </div>
                )}
                <CardHeader>
                  <div className="text-sm text-muted-foreground mb-2">
                    {item.publishedAt ? format(new Date(item.publishedAt), "PP") : ""}
                  </div>
                  <CardTitle className="text-xl font-serif line-clamp-2">
                    {t(item.titleEn, item.titleAr)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {t(item.excerptEn, item.excerptAr)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          {t("No news available.", "لا توجد أخبار متاحة.")}
        </div>
      )}
    </div>
  );
}
