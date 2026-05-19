import { useLanguage } from "@/lib/i18n";
import { Link, useRoute } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { SignInButton, useUser } from "@clerk/react";
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
  LogOut,
  ShieldAlert,
  LogIn
} from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = useLanguage();
  const [match] = useRoute("/:lang/admin/*?");
  const { isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { data: me, isLoading: meLoading } = useGetMe();

  if (!clerkLoaded || (isSignedIn && meLoading)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-md p-8 text-center shadow-sm">
          <LogIn className="w-10 h-10 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-serif font-semibold mb-2">{t("Admin Sign In Required", "تسجيل دخول الإدارة مطلوب")}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {t("You must be signed in with an admin account to access this area.", "يجب تسجيل الدخول بحساب إداري للوصول إلى هذه المنطقة.")}
          </p>
          <SignInButton mode="modal">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90 transition-colors">
              <LogIn className="w-4 h-4" />
              {t("Sign In", "تسجيل الدخول")}
            </button>
          </SignInButton>
          <p className="mt-6 text-xs text-muted-foreground">
            <Link href={`/${lang}`}><a className="underline hover:text-foreground">{t("Back to homepage", "العودة إلى الصفحة الرئيسية")}</a></Link>
          </p>
        </div>
      </div>
    );
  }

  if (!me || me.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-md p-8 text-center shadow-sm">
          <ShieldAlert className="w-10 h-10 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-serif font-semibold mb-2">{t("Not Authorized", "غير مصرح")}</h1>
          <p className="text-sm text-muted-foreground mb-2">
            {t("Your account does not have admin access.", "حسابك لا يملك صلاحيات إدارية.")}
          </p>
          {me?.email && (
            <p className="text-xs text-muted-foreground mb-6">
              {t("Signed in as", "مسجل الدخول باسم")}: <span className="font-mono">{me.email}</span>
            </p>
          )}
          <Link href={`/${lang}`}>
            <a className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90 transition-colors">
              {t("Back to homepage", "العودة إلى الصفحة الرئيسية")}
            </a>
          </Link>
        </div>
      </div>
    );
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
