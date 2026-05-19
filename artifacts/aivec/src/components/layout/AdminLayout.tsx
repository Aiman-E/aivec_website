import { useLanguage } from "@/lib/i18n";
import { Link, useRoute } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  CalendarDays, 
  Newspaper, 
  PenTool, 
  MessageSquare, 
  Award, 
  Image as ImageIcon,
  Users,
  LogOut
} from "lucide-react";
import { Redirect } from "wouter";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = useLanguage();
  const [match] = useRoute("/:lang/admin/*?");
  const { data: me, isLoading } = useGetMe();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;
  }

  if (!me || me.role !== "admin") {
    return <Redirect to={`/${lang}`} />;
  }

  const navItems = [
    { href: `/${lang}/admin`, icon: LayoutDashboard, label: t("Dashboard", "لوحة القيادة"), exact: true },
    { href: `/${lang}/admin/events`, icon: CalendarDays, label: t("Events", "الفعاليات") },
    { href: `/${lang}/admin/pages`, icon: FileText, label: t("Pages", "الصفحات") },
    { href: `/${lang}/admin/news`, icon: Newspaper, label: t("News", "الأخبار") },
    { href: `/${lang}/admin/blog`, icon: PenTool, label: t("Blog", "المدونة") },
    { href: `/${lang}/admin/contact`, icon: MessageSquare, label: t("Messages", "الرسائل") },
    { href: `/${lang}/admin/sponsors`, icon: Award, label: t("Sponsors", "الرعاة") },
    { href: `/${lang}/admin/hero-images`, icon: ImageIcon, label: t("Hero Images", "صور الخلفية") },
    { href: `/${lang}/admin/users`, icon: Users, label: t("Users", "المستخدمين") },
    { href: `/${lang}/admin/site-settings`, icon: Settings, label: t("Settings", "الإعدادات") },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="w-64 bg-card border-r flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6 pb-2">
          <h2 className="text-lg font-serif font-semibold text-primary">{t("Admin Panel", "لوحة الإدارة")}</h2>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.href 
              : location.pathname.startsWith(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <a className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
