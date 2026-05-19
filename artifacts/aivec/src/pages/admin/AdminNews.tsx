import { useLanguage } from "@/lib/i18n";
import { useListNews, useCreateNews, useUpdateNews, useDeleteNews, getListNewsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";

const newsSchema = z.object({
  slug: z.string().min(1),
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  published: z.boolean().default(false),
});
type NewsFormValues = z.infer<typeof newsSchema>;
const defaultValues: NewsFormValues = { slug: "", titleEn: "", titleAr: "", published: false };

export function AdminNews() {
  const { t } = useLanguage();
  const { data: news } = useListNews();
  const [dialogState, setDialogState] = useState<{ mode: "create" } | { mode: "edit"; id: number } | null>(null);
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsSchema),
    defaultValues,
  });

  useEffect(() => {
    if (dialogState?.mode === "edit") {
      const item = news?.find(p => p.id === dialogState.id);
      if (item) {
        form.reset({
          slug: item.slug,
          titleEn: item.titleEn ?? "",
          titleAr: item.titleAr ?? "",
          published: !!item.published,
        });
      }
    } else if (dialogState?.mode === "create") {
      form.reset(defaultValues);
    }
  }, [dialogState, news, form]);

  const onSubmit = (data: NewsFormValues) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
    if (dialogState?.mode === "edit") {
      updateNews.mutate({ id: dialogState.id, data }, {
        onSuccess: () => { toast({ title: t("News updated", "تم تحديث الخبر") }); setDialogState(null); invalidate(); },
        onError: (err: any) => toast({ title: t("Update failed", "فشل التحديث"), description: err?.message ?? "", variant: "destructive" }),
      });
    } else {
      createNews.mutate({ data }, {
        onSuccess: () => { toast({ title: t("News created", "تم إنشاء الخبر") }); setDialogState(null); invalidate(); },
        onError: (err: any) => toast({ title: t("Create failed", "فشل الإنشاء"), description: err?.message ?? "", variant: "destructive" }),
      });
    }
  };

  const isEdit = dialogState?.mode === "edit";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif">{t("News", "الأخبار")}</h1>
        <Dialog open={dialogState !== null} onOpenChange={(open) => setDialogState(open ? { mode: "create" } : null)}>
          <DialogTrigger asChild><Button>{t("Add News", "إضافة خبر")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isEdit ? t("Edit News", "تعديل الخبر") : t("Create News", "إنشاء خبر")}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="slug" render={({field}) => <FormItem><FormLabel>{t("Slug", "المعرّف")}</FormLabel><FormControl><Input {...field} dir="ltr"/></FormControl></FormItem>} />
                <FormField control={form.control} name="titleEn" render={({field}) => <FormItem><FormLabel>{t("Title (EN)", "العنوان (الإنجليزية)")}</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>} />
                <FormField control={form.control} name="titleAr" render={({field}) => <FormItem><FormLabel>{t("Title (AR)", "العنوان (العربية)")}</FormLabel><FormControl><Input {...field} dir="rtl"/></FormControl></FormItem>} />
                <FormField control={form.control} name="published" render={({field}) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel className="!mt-0">{t("Published", "منشور")}</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createNews.isPending || updateNews.isPending}>{t("Save", "حفظ")}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>{t("Title", "العنوان")}</TableHead><TableHead>{t("Status", "الحالة")}</TableHead><TableHead className="text-right">{t("Actions", "إجراءات")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {news?.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.titleEn}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${item.published ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                      {item.published ? t("Published", "منشور") : t("Draft", "مسودة")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2 rtl:space-x-reverse whitespace-nowrap">
                    <Button variant="outline" size="icon" title={t("Edit", "تعديل")} onClick={() => setDialogState({ mode: "edit", id: item.id })}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive" title={t("Delete", "حذف")} onClick={() => {
                      if (confirm(t("Delete this news item?", "هل تريد حذف هذا الخبر؟"))) deleteNews.mutate({id: item.id}, { onSuccess: () => queryClient.invalidateQueries({queryKey: getListNewsQueryKey()})});
                    }}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
