import { useLanguage } from "@/lib/i18n";
import { useGetPage, useUpdatePage } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const pageSchema = z.object({
  titleEn: z.string().optional(),
  titleAr: z.string().optional(),
  subtitleEn: z.string().optional(),
  subtitleAr: z.string().optional(),
  bodyEn: z.string().optional(),
  bodyAr: z.string().optional(),
});

type PageFormValues = z.infer<typeof pageSchema>;

export function AdminPageEdit() {
  const { lang, t } = useLanguage();
  const [match, params] = useRoute("/:lang/admin/pages/:key");
  const key = params?.key || "";
  const { toast } = useToast();

  const { data: page, isLoading } = useGetPage(key, { query: { enabled: !!key } as never });
  const updatePage = useUpdatePage();

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      titleEn: "", titleAr: "", subtitleEn: "", subtitleAr: "", bodyEn: "", bodyAr: ""
    }
  });

  useEffect(() => {
    if (page) {
      form.reset({
        titleEn: page.titleEn || "",
        titleAr: page.titleAr || "",
        subtitleEn: page.subtitleEn || "",
        subtitleAr: page.subtitleAr || "",
        bodyEn: page.bodyEn || "",
        bodyAr: page.bodyAr || "",
      });
    }
  }, [page, form]);

  if (isLoading) return <div>Loading...</div>;

  function onSubmit(data: PageFormValues) {
    updatePage.mutate({ key, data }, {
      onSuccess: () => toast({ title: t("Saved", "تم الحفظ") }),
      onError: () => toast({ variant: "destructive", title: t("Error", "خطأ") })
    });
  }

  const BackIcon = lang === 'ar' ? ChevronRight : ChevronLeft;

  return (
    <div className="max-w-5xl">
      <Link href={`/${lang}/admin/pages`} className="inline-flex items-center text-sm text-muted-foreground mb-6">
        <BackIcon className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Back to Pages", "العودة للصفحات")}
      </Link>
      
      <h1 className="text-3xl font-serif mb-8">{t("Edit Page", "تعديل الصفحة")}: {key}</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* English Column */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold border-b pb-2 mb-4">English</h3>
                <FormField control={form.control} name="titleEn" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="subtitleEn" render={({ field }) => (
                  <FormItem><FormLabel>Subtitle</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="bodyEn" render={({ field }) => (
                  <FormItem><FormLabel>Body (Markdown)</FormLabel><FormControl><Textarea rows={15} {...field} dir="ltr" className="font-mono text-sm" /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>

            {/* Arabic Column */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold border-b pb-2 mb-4" dir="rtl">العربية</h3>
                <FormField control={form.control} name="titleAr" render={({ field }) => (
                  <FormItem dir="rtl"><FormLabel>العنوان</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="subtitleAr" render={({ field }) => (
                  <FormItem dir="rtl"><FormLabel>العنوان الفرعي</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="bodyAr" render={({ field }) => (
                  <FormItem dir="rtl"><FormLabel>المحتوى</FormLabel><FormControl><Textarea rows={15} {...field} dir="rtl" /></FormControl></FormItem>
                )} />
              </CardContent>
            </Card>
          </div>
          
          <Button type="submit" disabled={updatePage.isPending}>
            {updatePage.isPending ? t("Saving...", "جاري الحفظ...") : t("Save Changes", "حفظ التغييرات")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
