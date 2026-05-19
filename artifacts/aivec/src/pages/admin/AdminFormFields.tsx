import { useLanguage } from "@/lib/i18n";
import { useRoute, Link } from "wouter";
import { useGetForm, useSetFormFields } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { FieldBuilder, makeNewField, type BuilderField } from "@/components/admin/FieldBuilder";

export function AdminFormFields() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/:lang/admin/forms/:id/fields");
  const formId = Number(params?.id);
  const { toast } = useToast();
  const { data, isLoading, refetch } = useGetForm(formId.toString(), {
    query: { enabled: !!formId } as never,
  });
  const setFields = useSetFormFields();
  const [fields, setLocalFields] = useState<BuilderField[]>([]);
  const loadedRef = useRef<number | null>(null);

  useEffect(() => {
    if (data?.fields && loadedRef.current !== formId) {
      setLocalFields(
        data.fields.map((f) => ({
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
      loadedRef.current = formId;
    }
  }, [data, formId]);

  if (isLoading) return <div className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;
  if (!data) return <div className="text-muted-foreground">{t("Form not found", "النموذج غير موجود")}</div>;

  const handleSave = () => {
    const ordered = fields.map((f, i) => ({ ...f, order: i }));
    setFields.mutate(
      { id: formId, data: { fields: ordered } as never },
      {
        onSuccess: () => {
          toast({ title: t("Fields saved", "تم حفظ الحقول") });
          refetch();
        },
        onError: () => toast({ variant: "destructive", title: t("Failed to save", "فشل الحفظ") }),
      },
    );
  };

  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;

  return (
    <div className="max-w-5xl space-y-6 pb-20">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <Link href={`/${lang}/admin/forms`} className="inline-flex items-center text-sm text-muted-foreground mb-4">
            <BackIcon className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {t("Back to Forms", "العودة للنماذج")}
          </Link>
          <h1 className="text-3xl font-serif">{t("Form Builder", "منشئ النموذج")}: {t(data.form.titleEn, data.form.titleAr)}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocalFields([...fields, makeNewField(fields.length)])}>
            <Plus className="w-4 h-4 mr-2" /> {t("Add Field", "إضافة حقل")}
          </Button>
          <Button onClick={handleSave} disabled={setFields.isPending}>
            {setFields.isPending ? t("Saving...", "جاري الحفظ...") : t("Save Fields", "حفظ الحقول")}
          </Button>
        </div>
      </div>

      <FieldBuilder fields={fields} onChange={setLocalFields} />
    </div>
  );
}
