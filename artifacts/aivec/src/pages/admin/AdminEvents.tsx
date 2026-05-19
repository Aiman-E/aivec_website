import { useLanguage } from "@/lib/i18n";
import { useListEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, getListEventsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, LayoutList, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUploadField, resolveImageUrl } from "@/components/admin/ImageUploadField";

const eventSchema = z.object({
  slug: z.string().min(1),
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  status: z.enum(["draft", "coming_soon", "open", "closed", "past"]),
  featured: z.boolean().default(false),
  posterUrl: z.string().optional().default(""),
});
type EventFormValues = z.infer<typeof eventSchema>;
const defaultValues: EventFormValues = { slug: "", titleEn: "", titleAr: "", status: "draft", featured: false, posterUrl: "" };

export function AdminEvents() {
  const { lang, t } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: events } = useListEvents();
  const [dialogState, setDialogState] = useState<{ mode: "create" } | { mode: "edit"; id: number } | null>(null);
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues,
  });

  useEffect(() => {
    if (dialogState?.mode === "edit") {
      const item = events?.find(e => e.id === dialogState.id);
      if (item) {
        form.reset({
          slug: item.slug,
          titleEn: item.titleEn ?? "",
          titleAr: item.titleAr ?? "",
          status: (item.status as EventFormValues["status"]) ?? "draft",
          featured: !!item.featured,
          posterUrl: item.posterUrl ?? "",
        });
      }
    } else if (dialogState?.mode === "create") {
      form.reset(defaultValues);
    }
  }, [dialogState, events, form]);

  const onSubmit = (data: EventFormValues) => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
    if (dialogState?.mode === "edit") {
      updateEvent.mutate({ id: dialogState.id, data }, {
        onSuccess: () => { toast({ title: t("Event updated", "تم تحديث الفعالية") }); setDialogState(null); invalidate(); },
        onError: (err: any) => toast({ title: t("Update failed", "فشل التحديث"), description: err?.message ?? "", variant: "destructive" }),
      });
    } else {
      createEvent.mutate({ data }, {
        onSuccess: () => { toast({ title: t("Event created", "تم إنشاء الفعالية") }); setDialogState(null); invalidate(); },
        onError: (err: any) => toast({ title: t("Create failed", "فشل الإنشاء"), description: err?.message ?? "", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm(t("Delete this event? This cannot be undone.", "هل تريد حذف هذه الفعالية؟ لا يمكن التراجع عن هذا الإجراء."))) {
      deleteEvent.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Event deleted" });
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-serif">{t("Events", "الفعاليات")}</h1>
        <Dialog open={dialogState !== null} onOpenChange={(open) => setDialogState(open ? { mode: "create" } : null)}>
          <DialogTrigger asChild>
            <Button>{t("Add Event", "إضافة فعالية")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogState?.mode === "edit" ? t("Edit Event", "تعديل الفعالية") : t("Create Event", "إنشاء فعالية")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="slug" render={({field}) => <FormItem><FormLabel>{t("Slug", "المعرّف")}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl></FormItem>} />
                <FormField control={form.control} name="titleEn" render={({field}) => <FormItem><FormLabel>{t("Title (EN)", "العنوان (الإنجليزية)")}</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                <FormField control={form.control} name="titleAr" render={({field}) => <FormItem><FormLabel>{t("Title (AR)", "العنوان (العربية)")}</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>} />
                <FormField control={form.control} name="status" render={({field}) => (
                  <FormItem>
                    <FormLabel>{t("Status", "الحالة")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="draft">{t("Draft", "مسودة")}</SelectItem>
                        <SelectItem value="coming_soon">{t("Coming Soon", "قريباً")}</SelectItem>
                        <SelectItem value="open">{t("Open", "متاح للتسجيل")}</SelectItem>
                        <SelectItem value="closed">{t("Closed", "مغلق")}</SelectItem>
                        <SelectItem value="past">{t("Past", "منتهي")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="featured" render={({field}) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel className="!mt-0">{t("Featured", "مميزة")}</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="posterUrl" render={({field}) => (
                  <FormItem>
                    <FormLabel>{t("Poster (optional)", "ملصق (اختياري)")}</FormLabel>
                    <FormControl>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        hint="Vertical event poster shown on the event page and listings."
                        previewClassName="w-24 h-32"
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createEvent.isPending || updateEvent.isPending}>{t("Save", "حفظ")}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Poster</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map(event => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="w-12 h-16 bg-muted border border-border overflow-hidden">
                    {event.posterUrl ? (
                      <img src={resolveImageUrl(event.posterUrl)} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{event.titleEn}</TableCell>
                <TableCell>{event.status}</TableCell>
                <TableCell>
                  <Switch checked={event.featured} onCheckedChange={(v) => updateEvent.mutate({ id: event.id, data: { featured: v } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() }) })} />
                </TableCell>
                <TableCell className="text-right space-x-2 rtl:space-x-reverse whitespace-nowrap">
                  <Button variant="outline" size="icon" title={t("Edit", "تعديل")} onClick={() => setDialogState({ mode: "edit", id: event.id })}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" title={t("Form Builder", "محرر النموذج")} onClick={() => setLocation(`/${lang}/admin/events/${event.id}/fields`)}>
                    <LayoutList className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" title={t("Registrations", "التسجيلات")} onClick={() => setLocation(`/${lang}/admin/events/${event.id}/registrations`)}>
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-white" title={t("Delete", "حذف")} onClick={() => handleDelete(event.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {events?.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No events found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
