import { useLanguage } from "@/lib/i18n";
import { useListBlog, useCreateBlog, useUpdateBlog, useDeleteBlog, getListBlogQueryKey } from "@workspace/api-client-react";
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

const blogSchema = z.object({
  slug: z.string().min(1),
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  published: z.boolean().default(false),
});
type BlogFormValues = z.infer<typeof blogSchema>;
const defaultValues: BlogFormValues = { slug: "", titleEn: "", titleAr: "", published: false };

export function AdminBlog() {
  const { t } = useLanguage();
  const { data: posts } = useListBlog();
  const [dialogState, setDialogState] = useState<{ mode: "create" } | { mode: "edit"; id: number } | null>(null);
  const createBlog = useCreateBlog();
  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues,
  });

  useEffect(() => {
    if (dialogState?.mode === "edit") {
      const item = posts?.find(p => p.id === dialogState.id);
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
  }, [dialogState, posts, form]);

  const onSubmit = (data: BlogFormValues) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListBlogQueryKey() });
    if (dialogState?.mode === "edit") {
      updateBlog.mutate({ id: dialogState.id, data }, {
        onSuccess: () => { toast({ title: t("Post updated", "تم تحديث المقال") }); setDialogState(null); invalidate(); },
        onError: (err: any) => toast({ title: t("Update failed", "فشل التحديث"), description: err?.message ?? "", variant: "destructive" }),
      });
    } else {
      createBlog.mutate({ data }, {
        onSuccess: () => { toast({ title: t("Post created", "تم إنشاء المقال") }); setDialogState(null); invalidate(); },
        onError: (err: any) => toast({ title: t("Create failed", "فشل الإنشاء"), description: err?.message ?? "", variant: "destructive" }),
      });
    }
  };

  const isEdit = dialogState?.mode === "edit";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif">{t("Blog", "المدونة")}</h1>
        <Dialog open={dialogState !== null} onOpenChange={(open) => setDialogState(open ? { mode: "create" } : null)}>
          <DialogTrigger asChild><Button>{t("Add Post", "إضافة مقال")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isEdit ? t("Edit Post", "تعديل المقال") : t("Create Post", "إنشاء مقال")}</DialogTitle></DialogHeader>
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
                <Button type="submit" className="w-full" disabled={createBlog.isPending || updateBlog.isPending}>{t("Save", "حفظ")}</Button>
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
              {posts?.map(item => (
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
                      if (confirm(t("Delete this article?", "هل تريد حذف هذا المقال؟"))) deleteBlog.mutate({id: item.id}, { onSuccess: () => queryClient.invalidateQueries({queryKey: getListBlogQueryKey()})});
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
