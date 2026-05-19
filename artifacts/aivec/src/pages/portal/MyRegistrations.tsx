import { useLanguage, useDateLocale } from "@/lib/i18n";
import { useListMyRegistrations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function MyRegistrations() {
  const { lang, t, tStatus } = useLanguage();
  const dateLocale = useDateLocale();
  const { data: registrations, isLoading } = useListMyRegistrations();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
      case 'rejected': return 'bg-destructive text-destructive-foreground hover:bg-destructive/80';
      case 'reviewed': return 'bg-accent text-accent-foreground hover:bg-accent/80';
      default: return 'bg-muted text-muted-foreground hover:bg-muted/80';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-serif text-foreground mb-8">
        {t("My Registrations", "تسجيلاتي")}
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : registrations && registrations.length > 0 ? (
        <div className="space-y-6">
          {registrations.map(reg => (
            <Card key={reg.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-xl font-serif mb-1">
                    {t(reg.eventTitleEn, reg.eventTitleAr) || t("Event", "فعالية")}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {t("Submitted on", "تم التسجيل في")}: {format(new Date(reg.createdAt), "PPP", { locale: dateLocale })}
                  </div>
                </div>
                <Badge className={getStatusColor(reg.status)}>
                  {tStatus(reg.status)}
                </Badge>
              </CardHeader>
              <CardContent>
                {reg.notes && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-1">{t("Admin Notes:", "ملاحظات الإدارة:")}</p>
                    <p className="text-sm text-muted-foreground">{reg.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card">
          <p>{t("You have not registered for any events yet.", "لم تقم بالتسجيل في أي فعاليات بعد.")}</p>
        </div>
      )}
    </div>
  );
}
