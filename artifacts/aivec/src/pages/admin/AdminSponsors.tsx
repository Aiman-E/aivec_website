import { useLanguage } from "@/lib/i18n";
import { useListSponsors, useCreateSponsor, useUpdateSponsor, useDeleteSponsor } from "@workspace/api-client-react";
import { ImageUploadField, resolveImageUrl } from "@/components/admin/ImageUploadField";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";

const sponsorSchema = z.object({
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  tier: z.enum(["platinum", "gold", "silver", "supporter", "government"]),
  logoUrl: z.string().optional().default(""),
  websiteUrl: z.string().optional().default(""),
});
type SponsorFormValues = z.infer<typeof sponsorSchema>;
const defaultValues: SponsorFormValues = { nameEn: "", nameAr: "", tier: "supporter", logoUrl: "", websiteUrl: "" };

export function AdminSponsors() {
  const { t } = useLanguage();
  const { data: sponsors, refetch } = useListSponsors();
  const [dialogState, setDialogState] = useState<{ mode: "create" } | { mode: "edit"; id: number } | null>(null);
  const createSponsor = useCreateSponsor();
  const updateSponsor = useUpdateSponsor();
  const deleteSponsor = useDeleteSponsor();
  const { toast } = useToast();

  const form = useForm<SponsorFormValues>({
    resolver: zodResolver(sponsorSchema),
    defaultValues,
  });

  useEffect(() => {
    if (dialogState?.mode === "edit") {
      const item = sponsors?.find(s => s.id === dialogState.id);
      if (item) {
        form.reset({
          nameEn: item.nameEn ?? "",
          nameAr: item.nameAr ?? "",
          tier: (item.tier as SponsorFormValues["tier"]) ?? "supporter",
          logoUrl: item.logoUrl ?? "",
          websiteUrl: item.websiteUrl ?? "",
        });
      }
    } else if (dialogState?.mode === "create") {
      form.reset(defaultValues);
    }
  }, [dialogState, sponsors, form]);

  const onSubmit = (data: SponsorFormValues) => {
    if (dialogState?.mode === "edit") {
      updateSponsor.mutate({ id: dialogState.id, data }, {
        onSuccess: () => { toast({ title: t("Sponsor updated", "تم تحديث الراعي") }); setDialogState(null); refetch(); },
        onError: (err: any) => toast({ title: t("Update failed", "فشل التحديث"), description: err?.message ?? "", variant: "destructive" }),
      });
    } else {
      createSponsor.mutate({ data }, {
        onSuccess: () => { toast({ title: t("Sponsor added", "تمت إضافة الراعي") }); setDialogState(null); refetch(); },
        onError: (err: any) => toast({ title: t("Create failed", "فشل الإنشاء"), description: err?.message ?? "", variant: "destructive" }),
      });
    }
  };

  const isEdit = dialogState?.mode === "edit";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif">{t("Sponsors", "الرعاة")}</h1>
        <Dialog open={dialogState !== null} onOpenChange={(open) => setDialogState(open ? { mode: "create" } : null)}>
          <DialogTrigger asChild><Button>{t("Add Sponsor", "إضافة راعٍ")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{isEdit ? t("Edit Sponsor", "تعديل الراعي") : t("Add Sponsor", "إضافة راعٍ")}</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nameEn" render={({field}) => <FormItem><FormLabel>{t("Name (EN)", "الاسم (الإنجليزية)")}</FormLabel><FormControl><Input {...field}/></FormControl></FormItem>} />
                <FormField control={form.control} name="nameAr" render={({field}) => <FormItem><FormLabel>{t("Name (AR)", "الاسم (العربية)")}</FormLabel><FormControl><Input {...field} dir="rtl"/></FormControl></FormItem>} />
                <FormField control={form.control} name="tier" render={({field}) => (
                  <FormItem>
                    <FormLabel>{t("Tier", "الفئة")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="government">{t("Government", "حكومي")}</SelectItem>
                        <SelectItem value="platinum">{t("Platinum", "بلاتيني")}</SelectItem>
                        <SelectItem value="gold">{t("Gold", "ذهبي")}</SelectItem>
                        <SelectItem value="silver">{t("Silver", "فضي")}</SelectItem>
                        <SelectItem value="supporter">{t("Supporter", "داعم")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="logoUrl" render={({field}) => (
                  <FormItem>
                    <FormLabel>{t("Logo", "الشعار")}</FormLabel>
                    <FormControl>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        hint="Upload the sponsor logo (PNG with transparent background recommended)."
                        previewClassName="w-24 h-24"
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="websiteUrl" render={({field}) => (
                  <FormItem>
                    <FormLabel>{t("Website (optional)", "الموقع (اختياري)")}</FormLabel>
                    <FormControl><Input {...field} dir="ltr" placeholder="https://example.com" /></FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createSponsor.isPending || updateSponsor.isPending}>{t("Save", "حفظ")}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>{t("Logo", "الشعار")}</TableHead><TableHead>{t("Name", "الاسم")}</TableHead><TableHead>{t("Tier", "الفئة")}</TableHead><TableHead className="text-right">{t("Actions", "إجراءات")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {sponsors?.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="w-16 h-16 bg-muted border border-border flex items-center justify-center overflow-hidden">
                      {item.logoUrl ? (
                        <img src={resolveImageUrl(item.logoUrl)} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.nameEn}</TableCell>
                  <TableCell className="capitalize">{item.tier}</TableCell>
                  <TableCell className="text-right space-x-2 rtl:space-x-reverse whitespace-nowrap">
                    <Button variant="outline" size="icon" title={t("Edit", "تعديل")} onClick={() => setDialogState({ mode: "edit", id: item.id })}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive" title={t("Delete", "حذف")} onClick={() => {
                      if (confirm(t("Delete this sponsor?", "هل تريد حذف هذا الراعي؟"))) deleteSponsor.mutate({id: item.id}, { onSuccess: () => refetch() });
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
