import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MyRegistrations() {
  const { lang, t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-serif">
            {t("Delegate Portal", "بوابة المشتركين")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            {t(
              "Account-based registration history is unavailable on this deployment. Please contact the conference team for registration support.",
              "سجل التسجيلات المرتبط بالحسابات غير متاح في هذا التشغيل. يرجى التواصل مع فريق المؤتمر للحصول على دعم التسجيل.",
            )}
          </p>
          <Link href={`/${lang}`}>
            <Button className="rounded-none">
              {t("Back to Homepage", "العودة إلى الصفحة الرئيسية")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
