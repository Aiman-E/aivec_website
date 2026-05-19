import { useLanguage, useLocaleTag } from "@/lib/i18n";
import { useGetAdminDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, Ticket, Newspaper, PenTool, MessageSquare } from "lucide-react";
import { RecentActivities } from "@/components/admin/RecentActivities";

export function AdminDashboard() {
  const { lang, t, tStatus } = useLanguage();
  const localeTag = useLocaleTag();
  const { data: dashboard, isLoading } = useGetAdminDashboard();

  if (isLoading) {
    return <div className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;
  }

  const stats = [
    { title: t("Total Users", "إجمالي المستخدمين"), value: dashboard?.totalUsers || 0, icon: Users },
    { title: t("Total Events", "إجمالي الفعاليات"), value: dashboard?.totalEvents || 0, icon: CalendarDays },
    { title: t("Registrations", "التسجيلات"), value: dashboard?.totalEnrollments || 0, icon: Ticket },
    { title: t("News Posts", "الأخبار"), value: dashboard?.newsPosts || 0, icon: Newspaper },
    { title: t("Blog Posts", "المقالات"), value: dashboard?.blogPosts || 0, icon: PenTool },
    { title: t("Messages", "الرسائل"), value: dashboard?.contactSubmissions || 0, icon: MessageSquare },
  ];

  return (
    <div>
      <h1 className="text-3xl font-serif text-foreground mb-8">{t("Dashboard", "لوحة القيادة")}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <RecentActivities limit={15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">{t("Recent Registrations", "أحدث التسجيلات")}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recentRegistrations && dashboard.recentRegistrations.length > 0 ? (
              <ul className="space-y-4">
                {dashboard.recentRegistrations.map((reg) => (
                  <li key={reg.id} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{reg.userName || reg.userEmail}</p>
                      <p className="text-muted-foreground">{t(reg.eventTitleEn, reg.eventTitleAr)}</p>
                    </div>
                    <span className="px-2 py-1 bg-muted rounded text-xs">{tStatus(reg.status)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("No recent registrations.", "لا توجد تسجيلات حديثة.")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">{t("Recent Messages", "أحدث الرسائل")}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recentContact && dashboard.recentContact.length > 0 ? (
              <ul className="space-y-4">
                {dashboard.recentContact.map((msg) => (
                  <li key={msg.id} className="text-sm border-b last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium">{msg.name}</p>
                      <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString(localeTag)}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-1">{msg.subject || msg.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("No recent messages.", "لا توجد رسائل حديثة.")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
