import { useLanguage } from "@/lib/i18n";
import { useGetSiteSettings, useGetPage, useListEvents, useListSponsors, useListNews } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export function Home() {
  const { lang, t } = useLanguage();
  const { data: settings } = useGetSiteSettings();
  const { data: aboutPage } = useGetPage("about");
  const { data: events } = useListEvents({ status: 'open' });
  const { data: news } = useListNews({ published: true });
  const { data: sponsors } = useListSponsors();

  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-background">
        <div className="absolute inset-0 bg-primary/5 z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />
        
        <div className="container relative z-10 px-4 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-accent/30 px-3 py-1 text-sm font-medium bg-accent/10 text-accent-foreground mb-8">
            {t("2nd Edition", "النسخة الثانية")}
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif max-w-4xl tracking-tight text-primary mb-6 leading-tight">
            {t(settings?.siteTitleEn || "Aden International Vascular & Endovascular Conference", settings?.siteTitleAr || "مؤتمر عدن الدولي للأوعية الدموية")}
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-muted-foreground mb-12 text-lg font-medium">
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
              <Calendar className="w-5 h-5 text-accent" />
              <span>{t(settings?.conferenceDatesEn || "December 1–3, 2026", settings?.conferenceDatesAr || "١-٣ ديسمبر ٢٠٢٦")}</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-sm">
              <MapPin className="w-5 h-5 text-accent" />
              <span>{t(settings?.venueNameEn || "Saba Grand Hall", settings?.venueNameAr || "قاعة سبأ الكبرى")}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href={`/${lang}/events`}>
              <Button size="lg" className="h-14 px-8 text-base shadow-lg">
                {t("Register Now", "سجل الآن")}
              </Button>
            </Link>
            <Link href={`/${lang}/about`}>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-background/50 backdrop-blur border-primary/20 hover:bg-primary/5">
                {t("About Conference", "عن المؤتمر")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* About Teaser */}
      {aboutPage && (
        <section className="py-24 bg-card">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-6">
              {t(aboutPage.titleEn, aboutPage.titleAr)}
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 line-clamp-4">
              {t(aboutPage.bodyEn, aboutPage.bodyAr)}
            </p>
            <Link href={`/${lang}/about`} className="inline-flex items-center text-primary font-medium hover:underline gap-1">
              {t("Read full story", "اقرأ المزيد")} <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Featured Events */}
      {events && events.length > 0 && (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-serif text-primary mb-2">{t("Upcoming Sessions", "الجلسات القادمة")}</h2>
                <p className="text-muted-foreground">{t("Register for our highlighted workshops and lectures.", "سجل في ورش العمل والمحاضرات المميزة.")}</p>
              </div>
              <Link href={`/${lang}/events`} className="hidden sm:inline-flex items-center text-primary font-medium hover:underline gap-1">
                {t("View all", "عرض الكل")} <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.slice(0, 3).map((event) => (
                <Card key={event.id} className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl font-serif line-clamp-2">
                      {t(event.titleEn, event.titleAr)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {t(event.summaryEn, event.summaryAr)}
                    </p>
                    {event.startsAt && (
                      <div className="flex items-center gap-2 text-sm font-medium mb-4">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{format(new Date(event.startsAt), "PP")}</span>
                      </div>
                    )}
                    <Link href={`/${lang}/events/${event.slug}`}>
                      <Button variant="outline" className="w-full">{t("Register", "التسجيل")}</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sponsor Wall Teaser */}
      {sponsors && sponsors.length > 0 && (
        <section className="py-24 bg-muted/30 border-y">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-serif text-primary mb-12 tracking-widest uppercase">
              {t("Supported By", "بدعم من")}
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale">
              {sponsors.slice(0, 5).map(sponsor => (
                <div key={sponsor.id} className="flex items-center justify-center">
                  {sponsor.logoUrl ? (
                    <img src={sponsor.logoUrl} alt={t(sponsor.nameEn, sponsor.nameAr)} className="max-w-[120px] max-h-[60px] object-contain" />
                  ) : (
                    <span className="font-serif text-xl font-bold">{t(sponsor.nameEn, sponsor.nameAr)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
