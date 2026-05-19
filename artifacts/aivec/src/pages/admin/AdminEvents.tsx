import { useLanguage } from "@/lib/i18n";
import { useListEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, getListEventsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocation } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

export function AdminEvents() {
  const { lang, t } = useLanguage();
  const [, setLocation] = useLocation();
  const { data: events, isLoading } = useListEvents();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createEvent = useCreateEvent();
  const deleteEvent = useDeleteEvent();
  const updateEvent = useUpdateEvent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: { slug: "", titleEn: "", titleAr: "", status: "draft" as any, featured: false, posterUrl: "" }
  });

  const onSubmit = (data: any) => {
    createEvent.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Event created" });
        setIsCreateOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
      }
    });
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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>{t("Add Event", "إضافة فعالية")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Create Event", "إنشاء فعالية")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="slug" render={({field}) => <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                <FormField control={form.control} name="titleEn" render={({field}) => <FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>} />
                <FormField control={form.control} name="titleAr" render={({field}) => <FormItem><FormLabel>Title (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl></FormItem>} />
                <FormField control={form.control} name="status" render={({field}) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="posterUrl" render={({field}) => (
                  <FormItem>
                    <FormLabel>Poster (optional)</FormLabel>
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
                <Button type="submit" className="w-full" disabled={createEvent.isPending}>Save</Button>
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
                <TableCell className="text-right space-x-2 rtl:space-x-reverse">
                  <Button variant="outline" size="icon" title="Form Builder" onClick={() => setLocation(`/${lang}/admin/events/${event.id}/fields`)}>
                    <LayoutList className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Registrations" onClick={() => setLocation(`/${lang}/admin/events/${event.id}/registrations`)}>
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-white" onClick={() => handleDelete(event.id)}>
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
