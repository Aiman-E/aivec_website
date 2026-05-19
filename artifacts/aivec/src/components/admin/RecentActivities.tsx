import { useLanguage, useLocaleTag } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminActivities } from "@/lib/admin-api";
import { Activity } from "lucide-react";

function actionLabel(action: string, t: (en: string, ar: string) => string): string {
  const map: Record<string, [string, string]> = {
    "admin.login": ["signed in", "سجل الدخول"],
    "event.create": ["created event", "أنشأ فعالية"],
    "event.update": ["updated event", "حدّث فعالية"],
    "event.delete": ["deleted event", "حذف فعالية"],
    "event.fields.update": ["updated event fields", "حدّث حقول الفعالية"],
    "registration.update": ["updated registration", "حدّث تسجيلاً"],
    "news.create": ["created news post", "أنشأ خبراً"],
    "news.update": ["updated news post", "حدّث خبراً"],
    "news.delete": ["deleted news post", "حذف خبراً"],
    "blog.create": ["created blog post", "أنشأ مقالاً"],
    "blog.update": ["updated blog post", "حدّث مقالاً"],
    "blog.delete": ["deleted blog post", "حذف مقالاً"],
    "sponsor.create": ["added sponsor", "أضاف راعياً"],
    "sponsor.update": ["updated sponsor", "حدّث راعياً"],
    "sponsor.delete": ["removed sponsor", "حذف راعياً"],
    "hero_image.create": ["added hero image", "أضاف صورة"],
    "hero_image.update": ["updated hero image", "حدّث صورة"],
    "hero_image.delete": ["removed hero image", "حذف صورة"],
    "page.update": ["updated page", "حدّث صفحة"],
    "site_settings.update": ["updated site settings", "حدّث إعدادات الموقع"],
    "contact.delete": ["deleted contact message", "حذف رسالة"],
    "user.role.update": ["changed user role", "غيّر دور مستخدم"],
    "admin_account.create": ["created admin account", "أنشأ حساب إداري"],
    "admin_account.update": ["updated admin account", "حدّث حساب إداري"],
    "admin_account.delete": ["deleted admin account", "حذف حساب إداري"],
  };
  const entry = map[action];
  if (entry) return t(entry[0], entry[1]);
  return action;
}

export function RecentActivities({ limit = 20 }: { limit?: number }) {
  const { t } = useLanguage();
  const localeTag = useLocaleTag();
  const { data: activities, isLoading } = useAdminActivities(limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {t("Recent Admin Activity", "نشاط الإدارة الأخير")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("Loading...", "جاري التحميل...")}</p>
        ) : !activities || activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("No activity yet.", "لا يوجد نشاط بعد.")}</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a) => (
              <li key={a.id} className="text-sm border-b last:border-0 pb-3 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug">
                      <span className="font-medium">{a.adminUsername}</span>{" "}
                      <span className="text-muted-foreground">{actionLabel(a.action, t)}</span>
                    </p>
                    {a.summary && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.summary}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.createdAt).toLocaleString(localeTag, { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
