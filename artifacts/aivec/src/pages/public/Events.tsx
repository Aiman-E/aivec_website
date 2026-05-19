import { useLanguage } from "@/lib/i18n";
import { useListEvents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

export function Events() {
  const { lang, t } = useLanguage();
  const { data: events, isLoading } = useListEvents();

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">
          {t("Conference Program", "برنامج المؤتمر")}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t("Explore our schedule of sessions, workshops, and keynote presentations.", "استكشف جدول الجلسات وورش العمل والعروض الرئيسية.")}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : events && events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    event.status === 'open' ? 'bg-secondary/10 text-secondary' :
                    event.status === 'coming_soon' ? 'bg-accent/10 text-accent' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {event.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <CardTitle className="text-xl font-serif line-clamp-2">
                  {t(event.titleEn, event.titleAr)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {t(event.summaryEn, event.summaryAr)}
                </p>
                <div className="space-y-2 text-sm text-foreground/80">
                  {event.startsAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{format(new Date(event.startsAt), "PPp")}</span>
                    </div>
                  )}
                  {event.venueEn && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{t(event.venueEn, event.venueAr)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t">
                <Link href={`/${lang}/events/${event.slug}`} className="w-full">
                  <Button variant="outline" className="w-full">{t("View Details", "عرض التفاصيل")}</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          {t("No events scheduled at this time.", "لا توجد فعاليات مجدولة في هذا الوقت.")}
        </div>
      )}
    </div>
  );
}
