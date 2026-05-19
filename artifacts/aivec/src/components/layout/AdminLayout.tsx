import { useLanguage } from "@/lib/i18n";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAdminMe, useAdminLogin, useAdminLogout } from "@/lib/admin-api";
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
  LogIn,
  ShieldCheck,
  UserCog,
  Menu,
  X,
} from "lucide-react";

function AdminLoginScreen() {
  const { lang, t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = useAdminLogin();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ username: username.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="max-w-md w-full bg-card border border-border rounded-md p-8 shadow-sm">
        <div className="text-center mb-6">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-primary" />
          <h1 className="text-2xl font-serif font-semibold mb-1">
            {t("Admin Panel", "لوحة الإدارة")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("Sign in with your admin credentials.", "سجل الدخول باستخدام بيانات اعتماد الإدارة.")}
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("Username", "اسم المستخدم")}
            </label>
            <input
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("Password", "كلمة المرور")}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {login.isPending ? t("Signing in...", "جاري تسجيل الدخول...") : t("Sign In", "تسجيل الدخول")}
          </button>
        </form>
        <p className="mt-6 text-xs text-muted-foreground text-center">
          <Link href={`/${lang}`} className="underline hover:text-foreground">
            {t("Back to homepage", "العودة إلى الصفحة الرئيسية")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = useLanguage();
  const [location] = useLocation();
  const { data: me, isLoading } = useAdminMe();
  const logout = useAdminLogout();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;
  }

  if (!me) {
    return <AdminLoginScreen />;
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
    { href: `/${lang}/admin/users`, icon: Users, label: t("Public Users", "المستخدمون العامون") },
    { href: `/${lang}/admin/accounts`, icon: UserCog, label: t("Admin Accounts", "حسابات الإدارة") },
    { href: `/${lang}/admin/site-settings`, icon: Settings, label: t("Settings", "الإعدادات") },
  ];

  async function onLogout() {
    try {
      await logout.mutateAsync();
    } catch {
      // ignore
    }
  }

  const activePage = navItems.find((item) =>
    item.exact ? location === item.href : location.startsWith(item.href),
  );

  const sidebarContent = (
    <>
      <div className="p-6 pb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-serif font-semibold text-primary">{t("Admin Panel", "لوحة الإدارة")}</h2>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {me.displayName || me.username}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden -m-2 p-2 text-muted-foreground hover:text-foreground"
          aria-label={t("Close menu", "إغلاق القائمة")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location === item.href
            : location.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <button
          type="button"
          onClick={onLogout}
          disabled={logout.isPending}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-60"
        >
          <LogOut className="w-4 h-4" />
          {t("Sign Out", "تسجيل الخروج")}
        </button>
      </div>
    </>
  );

  return (
    <div className="lg:flex min-h-screen bg-muted/30" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-card border-b px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="-m-2 p-2 text-muted-foreground hover:text-foreground"
          aria-label={t("Open menu", "فتح القائمة")}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground leading-none">{t("Admin", "الإدارة")}</p>
          <p className="text-sm font-medium truncate">
            {activePage?.label ?? t("Dashboard", "لوحة القيادة")}
          </p>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r flex-shrink-0 sticky top-0 h-screen flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" dir={lang === "ar" ? "rtl" : "ltr"}>
          <button
            type="button"
            aria-label={t("Close menu", "إغلاق القائمة")}
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className={`relative bg-card w-72 max-w-[85vw] h-full flex flex-col shadow-xl ${lang === "ar" ? "ml-auto" : "mr-auto"}`}>
            {sidebarContent}
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
