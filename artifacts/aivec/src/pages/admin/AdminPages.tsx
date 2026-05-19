import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminPages() {
  const { lang, t } = useLanguage();
  
  const pages = [
    { key: "about", name: t("About", "عن المؤتمر") },
    { key: "vision", name: t("Vision & Mission", "الرؤية والرسالة") },
    { key: "audience", name: t("Who Should Attend", "الجمهور المستهدف") },
    { key: "sponsorship", name: t("Sponsorship", "الرعاة") },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-serif mb-8">{t("Pages Content", "محتوى الصفحات")}</h1>
      
      <div className="grid gap-4">
        {pages.map(page => (
          <Card key={page.key}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{page.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{page.key}</p>
              </div>
              <Link href={`/${lang}/admin/pages/${page.key}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  {t("Edit", "تعديل")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
