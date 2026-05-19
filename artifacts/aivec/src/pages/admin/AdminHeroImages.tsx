import { useLanguage } from "@/lib/i18n";
import {
  useListHeroImages,
  useCreateHeroImage,
  useUpdateHeroImage,
  useDeleteHeroImage,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2 } from "lucide-react";
import { ImageUploadField, resolveImageUrl } from "@/components/admin/ImageUploadField";

const heroImageSchema = z.object({
  url: z.string().min(1, "URL is required"),
  captionEn: z.string().optional().default(""),
  captionAr: z.string().optional().default(""),
  order: z.coerce.number().int().optional().default(0),
});

type HeroImageFormValues = z.infer<typeof heroImageSchema>;
const defaultValues: HeroImageFormValues = { url: "", captionEn: "", captionAr: "", order: 0 };

export function AdminHeroImages() {
  const { t } = useLanguage();
  const { data: images, refetch } = useListHeroImages();
  const [dialogState, setDialogState] = useState<{ mode: "create" } | { mode: "edit"; id: number } | null>(null);
  const createImage = useCreateHeroImage();
  const updateImage = useUpdateHeroImage();
  const deleteImage = useDeleteHeroImage();
  const { toast } = useToast();

  const form = useForm<HeroImageFormValues>({
    resolver: zodResolver(heroImageSchema),
    defaultValues,
  });

  useEffect(() => {
    if (dialogState?.mode === "edit") {
      const item = images?.find(p => p.id === dialogState.id);
      if (item) {
        form.reset({
          url: item.url ?? "",
          captionEn: item.captionEn ?? "",
          captionAr: item.captionAr ?? "",
          order: item.order ?? 0,
        });
      }
    } else if (dialogState?.mode === "create") {
      form.reset(defaultValues);
    }
  }, [dialogState, images, form]);

  const onSubmit = (data: HeroImageFormValues) => {
    if (dialogState?.mode === "edit") {
      updateImage.mutate(
        { id: dialogState.id, data },
        {
          onSuccess: () => { toast({ title: t("Hero image updated", "تم تحديث الصورة") }); setDialogState(null); refetch(); },
          onError: (err: any) => toast({ title: t("Update failed", "فشل التحديث"), description: err?.message ?? "", variant: "destructive" }),
        }
      );
    } else {
      createImage.mutate(
        { data },
        {
          onSuccess: () => { toast({ title: t("Hero image added", "تمت إضافة الصورة") }); setDialogState(null); refetch(); },
          onError: (err: any) => toast({ title: t("Create failed", "فشل الإنشاء"), description: err?.message ?? "", variant: "destructive" }),
        }
      );
    }
  };

  const toggleActive = (id: number, active: boolean) => {
    updateImage.mutate(
      { id, data: { active } },
      { onSuccess: () => refetch() }
    );
  };

  const isEdit = dialogState?.mode === "edit";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif">{t("Hero Images", "صور الخلفية")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("Background slideshow on the landing page. Active images cycle every few seconds.",
               "عرض شرائح الخلفية على الصفحة الرئيسية. تتبدل الصور النشطة كل عدة ثوانٍ.")}
          </p>
        </div>
        <Dialog open={dialogState !== null} onOpenChange={(open) => setDialogState(open ? { mode: "create" } : null)}>
          <DialogTrigger asChild>
            <Button>{t("Add Image", "إضافة صورة")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEdit ? t("Edit Hero Image", "تعديل الصورة") : t("Add Hero Image", "إضافة صورة")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Image", "الصورة")}</FormLabel>
                      <FormControl>
                        <ImageUploadField
                          value={field.value}
                          onChange={field.onChange}
                          hint="Upload an image or paste a URL. Recommended 1920×1080."
                          previewClassName="w-32 h-20"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="captionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Caption (EN, optional)", "التعليق (الإنجليزية، اختياري)")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="captionAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Caption (AR, optional)", "التعليق (العربية، اختياري)")}</FormLabel>
                      <FormControl>
                        <Input dir="rtl" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Order", "الترتيب")}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createImage.isPending || updateImage.isPending}>
                  {t("Save", "حفظ")}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Preview", "معاينة")}</TableHead>
                <TableHead>{t("URL", "الرابط")}</TableHead>
                <TableHead>{t("Order", "الترتيب")}</TableHead>
                <TableHead>{t("Active", "نشط")}</TableHead>
                <TableHead className="text-right">{t("Actions", "إجراءات")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="w-24 h-16 bg-muted overflow-hidden border border-border">
                      <img
                        src={resolveImageUrl(item.url)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-md truncate">
                    {item.url}
                  </TableCell>
                  <TableCell>{item.order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.active}
                      onCheckedChange={(v) => toggleActive(item.id, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2 rtl:space-x-reverse whitespace-nowrap">
                    <Button variant="outline" size="icon" title={t("Edit", "تعديل")} onClick={() => setDialogState({ mode: "edit", id: item.id })}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive"
                      title={t("Delete", "حذف")}
                      onClick={() => {
                        if (confirm(t("Delete this hero image?", "هل تريد حذف هذه الصورة؟")))
                          deleteImage.mutate(
                            { id: item.id },
                            { onSuccess: () => refetch() }
                          );
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!images || images.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    {t("No hero images yet. The site will show the default anatomy illustration until you add some.",
                       "لا توجد صور خلفية بعد. سيعرض الموقع الرسم التشريحي الافتراضي حتى تتم إضافة صور.")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
