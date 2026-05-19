import { useLanguage } from "@/lib/i18n";
import { useRoute, Link } from "wouter";
import { useGetForm, useSubmitForm } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { FormRenderer } from "@/components/public/FormRenderer";
import { resolveImageUrl } from "@/components/admin/ImageUploadField";

export function FormPage() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/:lang/forms/:slug");
  const slug = params?.slug || "";
  const { toast } = useToast();
  const { data, isLoading } = useGetForm(slug, { query: { enabled: !!slug } as never });
  const submit = useSubmitForm();
  const [submitted, setSubmitted] = useState(false);

  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-32 max-w-3xl">
        <Skeleton className="h-12 w-2/3 mb-6" />
        <Skeleton className="h-6 w-1/2 mb-12" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-6 py-40 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-serif text-muted-foreground mb-8">{t("Form not found.", "النموذج غير موجود.")}</h1>
        <Link href={`/${lang}`} className="text-primary underline">{t("Back to home", "العودة للرئيسية")}</Link>
      </div>
    );
  }

  const { form, fields } = data;
  const logoSrc = form.logoUrl ? resolveImageUrl(form.logoUrl) : null;

  function onSubmit(answers: Record<string, unknown>) {
    submit.mutate(
      { slug, data: { answers } as never },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: unknown) => {
          const e = err as { response?: { data?: { error?: string } }; message?: string };
          toast({
            variant: "destructive",
            title: t("Submission failed", "فشل الإرسال"),
            description: e?.response?.data?.error || e?.message,
          });
        },
      },
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pt-28 pb-32">
      <section className="container mx-auto px-6 md:px-12 max-w-3xl">
        <Link href={`/${lang}`} className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-primary mb-12 transition-colors uppercase tracking-[0.2em]">
          <BackIcon className="w-4 h-4 mr-3 rtl:ml-3 rtl:mr-0" />
          {t("Home", "الرئيسية")}
        </Link>

        <div className="text-center mb-12">
          {logoSrc && (
            <img src={logoSrc} alt="" className="mx-auto h-24 w-auto object-contain mb-8" />
          )}
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight">
            {t(form.titleEn, form.titleAr)}
          </h1>
          {(form.descriptionEn || form.descriptionAr) && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto whitespace-pre-wrap">
              {t(form.descriptionEn || "", form.descriptionAr || "")}
            </p>
          )}
        </div>

        <div className="border border-border bg-card p-8 md:p-12 shadow-xl">
          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-serif font-bold mb-4">{t("Submitted", "تم الإرسال")}</h2>
              <p className="text-muted-foreground whitespace-pre-wrap max-w-xl mx-auto">
                {t(form.successMessageEn || "", form.successMessageAr || "")}
              </p>
            </div>
          ) : fields.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic">
              {t("This form has no fields yet.", "لا يحتوي هذا النموذج على حقول بعد.")}
            </div>
          ) : (
            <FormRenderer
              fields={fields}
              onSubmit={onSubmit}
              submitting={submit.isPending}
              submitLabel={t(form.submitLabelEn || "Submit", form.submitLabelAr || "إرسال")}
              uploadBasePath="/api/storage/public"
            />
          )}
        </div>
      </section>
    </div>
  );
}
