import { useLanguage } from "@/lib/i18n";
import { useGetSiteSettings, useUpdateSiteSettings } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const settingsSchema = z.object({
  siteTitleEn: z.string().optional(),
  siteTitleAr: z.string().optional(),
  conferenceYear: z.coerce.number(),
  conferenceNumber: z.coerce.number(),
  conferenceDatesEn: z.string().optional(),
  conferenceDatesAr: z.string().optional(),
  venueNameEn: z.string().optional(),
  venueNameAr: z.string().optional(),
  contactPhone: z.string().optional(),
  contactWhatsapp: z.string().optional(),
  contactEmails: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || !val.trim()) return true;
        return val
          .split(",")
          .map((e) => e.trim())
          .filter(Boolean)
          .every((e) => EMAIL_RE.test(e));
      },
      { message: "One or more emails are invalid" }
    ),
  footerNoteEn: z.string().optional(),
  footerNoteAr: z.string().optional(),
  fontEn: z.string().optional(),
  fontAr: z.string().optional(),
  statEditions: z.string().optional(),
  statDelegates: z.string().optional(),
  statFaculty: z.string().optional(),
  statCmeHours: z.string().optional(),
  statCountries: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  socialImageUrl: z.string().optional(),
});

const EN_FONTS = [
  "Fraunces",
  "Playfair Display",
  "Cormorant Garamond",
  "EB Garamond",
  "DM Serif Display",
  "Libre Caslon Text",
  "Lora",
  "Crimson Pro",
  "Inter",
  "DM Sans",
  "Manrope",
];

const AR_FONTS = [
  "Cairo",
  "Tajawal",
  "IBM Plex Sans Arabic",
  "Noto Naskh Arabic",
  "Noto Kufi Arabic",
  "Amiri",
  "Reem Kufi",
  "Markazi Text",
  "El Messiri",
  "Almarai",
];

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function AdminSiteSettings() {
  const { lang, t } = useLanguage();
  const { data: settings, isLoading } = useGetSiteSettings();
  const updateSettings = useUpdateSiteSettings();
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteTitleEn: "",
      siteTitleAr: "",
      conferenceYear: new Date().getFullYear(),
      conferenceNumber: 1,
      conferenceDatesEn: "",
      conferenceDatesAr: "",
      venueNameEn: "",
      venueNameAr: "",
      contactPhone: "",
      contactWhatsapp: "",
      contactEmails: "",
      footerNoteEn: "",
      footerNoteAr: "",
      fontEn: "Fraunces",
      fontAr: "Cairo",
      statEditions: "02",
      statDelegates: "500+",
      statFaculty: "35",
      statCmeHours: "12",
      statCountries: "4",
      logoUrl: "",
      faviconUrl: "",
      socialImageUrl: "",
    }
  });

  const watchedFontEn = form.watch("fontEn");
  const watchedFontAr = form.watch("fontAr");

  useEffect(() => {
    const families = [watchedFontEn, watchedFontAr].filter(Boolean) as string[];
    if (families.length === 0) return;
    const id = "aivec-admin-font-preview";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    const params = families
      .map((f) => `family=${encodeURIComponent(f.trim()).replace(/%20/g, "+")}:wght@400;600;700`)
      .join("&");
    link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
  }, [watchedFontEn, watchedFontAr]);

  // Remove the preview <link> when leaving the settings page so it doesn't
  // keep loading remote fonts on the public site.
  useEffect(() => {
    return () => {
      document.getElementById("aivec-admin-font-preview")?.remove();
    };
  }, []);

  useEffect(() => {
    if (settings) {
      form.reset({
        siteTitleEn: settings.siteTitleEn || "",
        siteTitleAr: settings.siteTitleAr || "",
        conferenceYear: settings.conferenceYear,
        conferenceNumber: settings.conferenceNumber,
        conferenceDatesEn: settings.conferenceDatesEn || "",
        conferenceDatesAr: settings.conferenceDatesAr || "",
        venueNameEn: settings.venueNameEn || "",
        venueNameAr: settings.venueNameAr || "",
        contactPhone: settings.contactPhone || "",
        contactWhatsapp: settings.contactWhatsapp || "",
        contactEmails: settings.contactEmails?.join(", ") || "",
        footerNoteEn: settings.footerNoteEn || "",
        footerNoteAr: settings.footerNoteAr || "",
        fontEn: settings.fontEn || "Fraunces",
        fontAr: settings.fontAr || "Cairo",
        statEditions: settings.statEditions ?? "02",
        statDelegates: settings.statDelegates ?? "500+",
        statFaculty: settings.statFaculty ?? "35",
        statCmeHours: settings.statCmeHours ?? "12",
        statCountries: settings.statCountries ?? "4",
        logoUrl: settings.logoUrl ?? "",
        faviconUrl: settings.faviconUrl ?? "",
        socialImageUrl: settings.socialImageUrl ?? "",
      });
    }
  }, [settings, form]);

  if (isLoading) return <div className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;

  function onSubmit(data: SettingsFormValues) {
    const payload = {
      ...data,
      contactEmails: data.contactEmails ? data.contactEmails.split(",").map(e => e.trim()).filter(Boolean) : [],
    };
    
    updateSettings.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: t("Settings updated", "تم تحديث الإعدادات") });
      },
      onError: () => {
        toast({ variant: "destructive", title: t("Error", "خطأ") });
      }
    });
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-serif mb-8">{t("Site Settings", "إعدادات الموقع")}</h1>
      
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("General Info", "المعلومات العامة")}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="siteTitleEn" render={({ field }) => (
                    <FormItem><FormLabel>Site Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="siteTitleAr" render={({ field }) => (
                    <FormItem><FormLabel>عنوان الموقع (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="conferenceYear" render={({ field }) => (
                    <FormItem><FormLabel>Conference Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="conferenceNumber" render={({ field }) => (
                    <FormItem><FormLabel>Edition Number</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Date & Venue", "الزمان والمكان")}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="conferenceDatesEn" render={({ field }) => (
                    <FormItem><FormLabel>Dates (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="conferenceDatesAr" render={({ field }) => (
                    <FormItem><FormLabel>التواريخ (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="venueNameEn" render={({ field }) => (
                    <FormItem><FormLabel>Venue (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="venueNameAr" render={({ field }) => (
                    <FormItem><FormLabel>المكان (AR)</FormLabel><FormControl><Input {...field} dir="rtl" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Contact", "معلومات التواصل")}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contactWhatsapp" render={({ field }) => (
                    <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contactEmails" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Emails (comma separated)</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Typography", "الخطوط")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Choose the display font for each language. Changes apply site-wide after saving.",
                    "اختر خط العرض لكل لغة. تُطبَّق التغييرات على الموقع بعد الحفظ."
                  )}
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="fontEn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>English Font</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "Fraunces"}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EN_FONTS.map((f) => (
                            <SelectItem key={f} value={f} style={{ fontFamily: `'${f}', serif` }}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div
                        className="mt-2 px-3 py-3 border bg-muted/30 text-2xl"
                        style={{ fontFamily: `'${field.value || "Fraunces"}', serif` }}
                      >
                        AIVEC 2026 — Aden Vascular Conference
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="fontAr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الخط العربي</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "Cairo"}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AR_FONTS.map((f) => (
                            <SelectItem key={f} value={f} style={{ fontFamily: `'${f}', sans-serif` }}>
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div
                        dir="rtl"
                        className="mt-2 px-3 py-3 border bg-muted/30 text-2xl"
                        style={{ fontFamily: `'${field.value || "Cairo"}', sans-serif` }}
                      >
                        مؤتمر عدن الدولي للأوعية الدموية
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Home Page Stats", "إحصائيات الصفحة الرئيسية")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Numbers shown in the stats banner on the home page. You can include suffixes like '500+' or zero-padded values like '02'.",
                    "الأرقام المعروضة في شريط الإحصائيات على الصفحة الرئيسية. يمكنك استخدام لواحق مثل '+500' أو قيم مثل '02'."
                  )}
                </p>
                <div className="grid md:grid-cols-5 gap-4">
                  <FormField control={form.control} name="statEditions" render={({ field }) => (
                    <FormItem><FormLabel>{t("Editions", "النسخ")}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="statDelegates" render={({ field }) => (
                    <FormItem><FormLabel>{t("Delegates", "المشاركون")}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="statFaculty" render={({ field }) => (
                    <FormItem><FormLabel>{t("Faculty", "المتحدثون")}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="statCmeHours" render={({ field }) => (
                    <FormItem><FormLabel>{t("CME Hours", "ساعات معتمدة")}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="statCountries" render={({ field }) => (
                    <FormItem><FormLabel>{t("Countries", "الدول")}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Branding & Images", "الهوية والصور")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Site logo, browser favicon, and the image used when the site is shared on social media.",
                    "شعار الموقع، أيقونة المتصفح، والصورة المستخدمة عند مشاركة الموقع على وسائل التواصل."
                  )}
                </p>
                <div className="grid gap-6">
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (
                    <FormItem>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        label={t("Logo", "الشعار")}
                        previewClassName="w-32 h-20"
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="faviconUrl" render={({ field }) => (
                    <FormItem>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        label={t("Favicon", "أيقونة المتصفح")}
                        hint={t("Square image, ideally 256×256 PNG.", "صورة مربعة، يفضّل 256×256 PNG.")}
                        previewClassName="w-16 h-16"
                        accept="image/png,image/x-icon,image/svg+xml"
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="socialImageUrl" render={({ field }) => (
                    <FormItem>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        label={t("Social Share Image", "صورة المشاركة")}
                        hint={t("Recommended 1200×630 for Facebook/Twitter previews.", "يفضّل 1200×630 لمعاينات فيسبوك وتويتر.")}
                        previewClassName="w-32 h-20"
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <Button type="submit" disabled={updateSettings.isPending}>
                {updateSettings.isPending ? t("Saving...", "جاري الحفظ...") : t("Save Settings", "حفظ الإعدادات")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
