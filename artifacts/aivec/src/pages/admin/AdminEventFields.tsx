import { useLanguage } from "@/lib/i18n";
import { useRoute, Link } from "wouter";
import { useGetEvent, useSetEventFields } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { FieldBuilder, makeNewField, type BuilderField } from "@/components/admin/FieldBuilder";

export function AdminEventFields() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/:lang/admin/events/:id/fields");
  const eventId = Number(params?.id);
  const { toast } = useToast();

  const { data: eventData, isLoading, refetch } = useGetEvent(eventId.toString(), {
    query: { enabled: !!eventId } as never,
  });

  const setEventFields = useSetEventFields();
  const [fields, setFields] = useState<BuilderField[]>([]);
  const loadedForEventRef = useRef<number | null>(null);

  useEffect(() => {
    if (eventData?.fields && loadedForEventRef.current !== eventId) {
      setFields(
        eventData.fields.map((f) => ({
          fieldKey: f.fieldKey,
          fieldType: f.fieldType,
          labelEn: f.labelEn || "",
          labelAr: f.labelAr || "",
          helpEn: f.helpEn || "",
          helpAr: f.helpAr || "",
          placeholderEn: f.placeholderEn || "",
          placeholderAr: f.placeholderAr || "",
          required: !!f.required,
          order: f.order,
          options: f.options || [],
        })),
      );
      loadedForEventRef.current = eventId;
    }
  }, [eventData, eventId]);

  if (isLoading) return <div className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;
  if (!eventData) return <div className="text-muted-foreground">{t("Event not found", "الفعالية غير موجودة")}</div>;

  const handleSave = () => {
    const ordered = fields.map((f, i) => ({ ...f, order: i }));
    setEventFields.mutate(
      { id: eventId, data: { fields: ordered } as never },
      {
        onSuccess: () => {
          toast({ title: t("Fields saved successfully", "تم حفظ الحقول بنجاح") });
          refetch();
        },
        onError: () => toast({ variant: "destructive", title: t("Failed to save fields", "فشل حفظ الحقول") }),
      },
    );
  };

  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <Link href={`/${lang}/admin/events`} className="inline-flex items-center text-sm text-muted-foreground mb-4">
            <BackIcon className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {t("Back to Events", "العودة للفعاليات")}
          </Link>
          <h1 className="text-3xl font-serif">{t("Registration Fields", "حقول التسجيل")}: {eventData.event.titleEn}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFields([...fields, makeNewField(fields.length)])}>
            <Plus className="w-4 h-4 mr-2" /> {t("Add Field", "إضافة حقل")}
          </Button>
          <Button onClick={handleSave} disabled={setEventFields.isPending}>
            {setEventFields.isPending ? t("Saving...", "جاري الحفظ...") : t("Save Fields", "حفظ الحقول")}
          </Button>
        </div>
      </div>

      <FieldBuilder fields={fields} onChange={setFields} />
    </div>
  );
}
