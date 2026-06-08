import { useLanguage } from "@/lib/i18n";
import { useGetSiteSettings, useUpdateSiteSettings, useListForms } from "@workspace/api-client-react";
import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { sanitizeFontName, sanitizeFontUrl, applyFontFaces, applyGoogleFontsLink } from "@/components/FontLoader";

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
  contactPhones: z
    .array(
      z.object({
        number: z.string().min(1, "Phone number is required"),
        whatsapp: z.boolean(),
      })
    )
    .default([]),
  contactEmails: z
    .array(
      z.object({
        value: z
          .string()
          .min(1, "Email is required")
          .refine((v) => EMAIL_RE.test(v), { message: "Invalid email" }),
      })
    )
    .default([]),
  heroMode: z.enum(["images", "video"]).default("images"),
  heroVideoUrl: z.string().optional(),
  footerNoteEn: z.string().optional(),
  footerNoteAr: z.string().optional(),
  fontEn: z.string().optional(),
  fontAr: z.string().optional(),
  fontEnUrl: z.string().optional(),
  fontArUrl: z.string().optional(),
  statEditions: z.string().optional(),
  statEditionsLabelEn: z.string().optional(),
  statEditionsLabelAr: z.string().optional(),
  statDelegates: z.string().optional(),
  statDelegatesLabelEn: z.string().optional(),
  statDelegatesLabelAr: z.string().optional(),
  statFaculty: z.string().optional(),
  statFacultyLabelEn: z.string().optional(),
  statFacultyLabelAr: z.string().optional(),
  statCmeHours: z.string().optional(),
  statCmeHoursLabelEn: z.string().optional(),
  statCmeHoursLabelAr: z.string().optional(),
  statCountries: z.string().optional(),
  statCountriesLabelEn: z.string().optional(),
  statCountriesLabelAr: z.string().optional(),
  heroCtaFormSlug: z.string().optional(),
  heroCtaLabelEn: z.string().optional(),
  heroCtaLabelAr: z.string().optional(),
  heroSecondaryCtaMode: z.string().optional(),
  heroSecondaryCtaLabelEn: z.string().optional(),
  heroSecondaryCtaLabelAr: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  socialImageUrl: z.string().optional(),
  venueImageUrl: z.string().optional(),
  aboutImageUrl: z.string().optional(),
  quoteImageUrl: z.string().optional(),
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
  const { data: formsList } = useListForms();
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
      contactPhones: [],
      contactEmails: [],
      heroMode: "images",
      heroVideoUrl: "",
      footerNoteEn: "",
      footerNoteAr: "",
      fontEn: "Fraunces",
      fontAr: "Cairo",
      fontEnUrl: "",
      fontArUrl: "",
      statEditions: "02",
      statEditionsLabelEn: "",
      statEditionsLabelAr: "",
      statDelegates: "500+",
      statDelegatesLabelEn: "",
      statDelegatesLabelAr: "",
      statFaculty: "35",
      statFacultyLabelEn: "",
      statFacultyLabelAr: "",
      statCmeHours: "12",
      statCmeHoursLabelEn: "",
      statCmeHoursLabelAr: "",
      statCountries: "4",
      statCountriesLabelEn: "",
      statCountriesLabelAr: "",
      heroCtaFormSlug: "",
      heroCtaLabelEn: "",
      heroCtaLabelAr: "",
      heroSecondaryCtaMode: "contact",
      heroSecondaryCtaLabelEn: "",
      heroSecondaryCtaLabelAr: "",
      logoUrl: "",
      faviconUrl: "",
      socialImageUrl: "",
      venueImageUrl: "",
      aboutImageUrl: "",
      quoteImageUrl: "",
    }
  });

  const watchedFontEn = form.watch("fontEn");
  const watchedFontAr = form.watch("fontAr");
  const watchedFontEnUrl = form.watch("fontEnUrl");
  const watchedFontArUrl = form.watch("fontArUrl");

  useEffect(() => {
    const linkId = "aivec-admin-font-preview";
    const styleId = "aivec-admin-font-preview-style";
    const fontEn = sanitizeFontName(watchedFontEn, "Fraunces");
    const fontAr = sanitizeFontName(watchedFontAr, "Cairo");
    const enUrl = sanitizeFontUrl(watchedFontEnUrl);
    const arUrl = sanitizeFontUrl(watchedFontArUrl);

    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }
    applyFontFaces(style, [
      { family: fontEn, url: enUrl },
      { family: fontAr, url: arUrl },
    ]);

    applyGoogleFontsLink(linkId, [
      enUrl ? "" : fontEn,
      arUrl ? "" : fontAr,
    ].filter(Boolean));
  }, [watchedFontEn, watchedFontAr, watchedFontEnUrl, watchedFontArUrl]);

  // Remove the preview <link> and @font-face style when leaving the settings
  // page so they don't keep loading remote fonts on the public site.
  useEffect(() => {
    return () => {
      document.getElementById("aivec-admin-font-preview")?.remove();
      document.getElementById("aivec-admin-font-preview-style")?.remove();
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
        contactPhones:
          settings.contactPhones && settings.contactPhones.length > 0
            ? settings.contactPhones.map((p) => ({
                number: p.number ?? "",
                whatsapp: !!p.whatsapp,
              }))
            : (() => {
                const legacy: { number: string; whatsapp: boolean }[] = [];
                const phone = settings.contactPhone?.trim();
                const wa = settings.contactWhatsapp?.trim();
                if (phone) legacy.push({ number: phone, whatsapp: !!wa && wa === phone });
                if (wa && wa !== phone) legacy.push({ number: wa, whatsapp: true });
                return legacy;
              })(),
        contactEmails: (settings.contactEmails ?? []).map((e) => ({ value: e })),
        heroMode: (settings.heroMode === "video" ? "video" : "images") as "images" | "video",
        heroVideoUrl: settings.heroVideoUrl ?? "",
        footerNoteEn: settings.footerNoteEn || "",
        footerNoteAr: settings.footerNoteAr || "",
        fontEn: settings.fontEn || "Fraunces",
        fontAr: settings.fontAr || "Cairo",
        fontEnUrl: settings.fontEnUrl ?? "",
        fontArUrl: settings.fontArUrl ?? "",
        statEditions: settings.statEditions ?? "02",
        statEditionsLabelEn: settings.statEditionsLabelEn ?? "",
        statEditionsLabelAr: settings.statEditionsLabelAr ?? "",
        statDelegates: settings.statDelegates ?? "500+",
        statDelegatesLabelEn: settings.statDelegatesLabelEn ?? "",
        statDelegatesLabelAr: settings.statDelegatesLabelAr ?? "",
        statFaculty: settings.statFaculty ?? "35",
        statFacultyLabelEn: settings.statFacultyLabelEn ?? "",
        statFacultyLabelAr: settings.statFacultyLabelAr ?? "",
        statCmeHours: settings.statCmeHours ?? "12",
        statCmeHoursLabelEn: settings.statCmeHoursLabelEn ?? "",
        statCmeHoursLabelAr: settings.statCmeHoursLabelAr ?? "",
        statCountries: settings.statCountries ?? "4",
        statCountriesLabelEn: settings.statCountriesLabelEn ?? "",
        statCountriesLabelAr: settings.statCountriesLabelAr ?? "",
        heroCtaFormSlug: settings.heroCtaFormSlug ?? "",
        heroCtaLabelEn: settings.heroCtaLabelEn ?? "",
        heroCtaLabelAr: settings.heroCtaLabelAr ?? "",
        heroSecondaryCtaMode: settings.heroSecondaryCtaMode ?? "contact",
        heroSecondaryCtaLabelEn: settings.heroSecondaryCtaLabelEn ?? "",
        heroSecondaryCtaLabelAr: settings.heroSecondaryCtaLabelAr ?? "",
        logoUrl: settings.logoUrl ?? "",
        faviconUrl: settings.faviconUrl ?? "",
        socialImageUrl: settings.socialImageUrl ?? "",
        venueImageUrl: settings.venueImageUrl ?? "",
        aboutImageUrl: settings.aboutImageUrl ?? "",
        quoteImageUrl: settings.quoteImageUrl ?? "",
      });
    }
  }, [settings, form]);

  if (isLoading) return <div className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>;

  function onSubmit(data: SettingsFormValues) {
    const phones = (data.contactPhones ?? [])
      .map((p) => ({ number: p.number.trim(), whatsapp: !!p.whatsapp }))
      .filter((p) => p.number.length > 0);
    const payload = {
      ...data,
      heroCtaFormSlug: data.heroCtaFormSlug?.trim() ? data.heroCtaFormSlug.trim() : null,
      contactPhones: phones,
      contactPhone: phones[0]?.number ?? "",
      contactWhatsapp: phones.find((p) => p.whatsapp)?.number ?? "",
      contactEmails: (data.contactEmails ?? [])
        .map((e) => e.value.trim())
        .filter(Boolean),
      heroVideoUrl: data.heroVideoUrl?.trim() ? data.heroVideoUrl.trim() : null,
      fontEnUrl: data.fontEnUrl?.trim() ? data.fontEnUrl.trim() : null,
      fontArUrl: data.fontArUrl?.trim() ? data.fontArUrl.trim() : null,
      venueImageUrl: data.venueImageUrl?.trim() ? data.venueImageUrl.trim() : null,
      aboutImageUrl: data.aboutImageUrl?.trim() ? data.aboutImageUrl.trim() : null,
      quoteImageUrl: data.quoteImageUrl?.trim() ? data.quoteImageUrl.trim() : null,
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
                <h3 className="font-semibold text-lg border-b pb-2">{t("Hero CTA Button", "زر الدعوة الرئيسي")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Replaces the hero \"Explore Program\" button with a link to the selected form. Leave empty to keep the default.",
                    "يستبدل زر \"استعرض البرنامج\" في الواجهة برابط إلى النموذج المحدد. اتركه فارغًا للإبقاء على الافتراضي."
                  )}
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="heroCtaFormSlug" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("Linked Form", "النموذج المرتبط")}</FormLabel>
                      <Select
                        value={field.value || "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={t("— None —", "— لا شيء —")} /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">{t("— None —", "— لا شيء —")}</SelectItem>
                          {(formsList ?? [])
                            .filter((f) => f.status === "open")
                            .map((f) => (
                              <SelectItem key={f.slug} value={f.slug}>
                                {(lang === "ar" ? f.titleAr : f.titleEn) || f.slug}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="heroCtaLabelEn" render={({ field }) => (
                    <FormItem><FormLabel>Button Label (EN)</FormLabel><FormControl><Input {...field} placeholder="Join the Conference" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="heroCtaLabelAr" render={({ field }) => (
                    <FormItem><FormLabel>نص الزر (AR)</FormLabel><FormControl><Input {...field} dir="rtl" placeholder="انضم إلى المؤتمر" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                <h4 className="font-medium text-base pt-4">{t("Secondary Button", "الزر الثانوي")}</h4>
                <p className="text-xs text-muted-foreground -mt-2">
                  {t(
                    "The smaller outlined button next to the main CTA. Choose what it does and what it says.",
                    "الزر الأصغر الموجود بجانب الزر الرئيسي. اختر وظيفته والنص الذي يظهر عليه."
                  )}
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="heroSecondaryCtaMode" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t("Action", "الإجراء")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "contact"}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="contact">{t("Scroll to Contact section", "التمرير إلى قسم التواصل")}</SelectItem>
                          <SelectItem value="upload_research">{t("Open scientific paper upload popup", "فتح نافذة إرسال بحث علمي")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="heroSecondaryCtaLabelEn" render={({ field }) => (
                    <FormItem><FormLabel>Button Label (EN)</FormLabel><FormControl><Input {...field} placeholder="Contact Us" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="heroSecondaryCtaLabelAr" render={({ field }) => (
                    <FormItem><FormLabel>نص الزر (AR)</FormLabel><FormControl><Input {...field} dir="rtl" placeholder="تواصل معنا" /></FormControl><FormMessage /></FormItem>
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

              <div className="space-y-6">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Contact", "معلومات التواصل")}</h3>

                <ContactPhonesField />
                <ContactEmailsField />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Hero Media", "وسائط الواجهة")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Choose between rotating images (managed under Hero Images) or a single background video.",
                    "اختر بين صور متبدلة (تُدار من قسم صور الواجهة) أو فيديو خلفية واحد."
                  )}
                </p>
                <FormField control={form.control} name="heroMode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Hero Mode", "نمط الواجهة")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="images">{t("Rotating Images", "صور متبدلة")}</SelectItem>
                        <SelectItem value="video">{t("Single Video", "فيديو واحد")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {form.watch("heroMode") === "video" && (
                  <FormField control={form.control} name="heroVideoUrl" render={({ field }) => (
                    <FormItem>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        label={t("Hero Video", "فيديو الواجهة")}
                        hint={t("MP4 or WebM. Will autoplay muted as background.", "MP4 أو WebM. سيُشغَّل تلقائياً بدون صوت كخلفية.")}
                        previewClassName="w-64 h-36"
                        accept="video/mp4,video/webm"
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Typography", "الخطوط")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Choose the display font for each language. Changes apply site-wide after saving.",
                    "اختر خط العرض لكل لغة. تُطبَّق التغييرات على الموقع بعد الحفظ."
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Pick a Google Font by name, or upload your own font file (.woff2, .woff, .ttf, .otf). When you upload a file, that file is used for the family name you typed.",
                    "اختر خط Google بالاسم، أو ارفع ملف خط خاص بك (.woff2 أو .woff أو .ttf أو .otf). عند رفع ملف، يُستخدم هذا الملف للاسم الذي كتبته."
                  )}
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 border border-border/40 rounded-sm">
                    <FormField control={form.control} name="fontEn" render={({ field }) => (
                      <FormItem>
                        <FormLabel>English Font Family</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            dir="ltr"
                            list="aivec-en-font-suggestions"
                            placeholder="Fraunces"
                          />
                        </FormControl>
                        <datalist id="aivec-en-font-suggestions">
                          {EN_FONTS.map((f) => <option key={f} value={f} />)}
                        </datalist>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="fontEnUrl" render={({ field }) => (
                      <FormItem>
                        <ImageUploadField
                          value={field.value}
                          onChange={field.onChange}
                          label={t("Custom Font File (optional)", "ملف خط مخصص (اختياري)")}
                          hint={t(
                            ".woff2 recommended. The file becomes the source for the family name above.",
                            "يفضّل .woff2. سيُستخدم الملف كمصدر للخط بالاسم أعلاه."
                          )}
                          previewClassName="w-20 h-20"
                          accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
                        />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div
                      className="mt-2 px-3 py-3 border bg-muted/30 text-2xl"
                      style={{ fontFamily: `'${form.watch("fontEn") || "Fraunces"}', serif` }}
                    >
                      AIVEC 2026 — Aden Vascular Conference
                    </div>
                  </div>

                  <div className="space-y-3 p-4 border border-border/40 rounded-sm">
                    <FormField control={form.control} name="fontAr" render={({ field }) => (
                      <FormItem>
                        <FormLabel>الخط العربي</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            dir="ltr"
                            list="aivec-ar-font-suggestions"
                            placeholder="Cairo"
                          />
                        </FormControl>
                        <datalist id="aivec-ar-font-suggestions">
                          {AR_FONTS.map((f) => <option key={f} value={f} />)}
                        </datalist>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="fontArUrl" render={({ field }) => (
                      <FormItem>
                        <ImageUploadField
                          value={field.value}
                          onChange={field.onChange}
                          label={t("Custom Font File (optional)", "ملف خط مخصص (اختياري)")}
                          hint={t(
                            ".woff2 recommended. The file becomes the source for the family name above.",
                            "يفضّل .woff2. سيُستخدم الملف كمصدر للخط بالاسم أعلاه."
                          )}
                          previewClassName="w-20 h-20"
                          accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
                        />
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div
                      dir="rtl"
                      className="mt-2 px-3 py-3 border bg-muted/30 text-2xl"
                      style={{ fontFamily: `'${form.watch("fontAr") || "Cairo"}', sans-serif` }}
                    >
                      مؤتمر عدن الدولي للأوعية الدموية
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">{t("Home Page Stats", "إحصائيات الصفحة الرئيسية")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Numbers and labels shown in the stats banner on the home page. Numbers can include suffixes like '500+' or zero-padded values like '02'. Leave a label empty to use the default.",
                    "الأرقام والتسميات المعروضة في شريط الإحصائيات على الصفحة الرئيسية. يمكن أن تتضمن الأرقام لواحق مثل '+500' أو قيمًا مثل '02'. اترك التسمية فارغة لاستخدام الافتراضي."
                  )}
                </p>
                {([
                  { key: "Editions", defaultEn: "Edition", defaultAr: "النسخة",
                    num: "statEditions", labelEn: "statEditionsLabelEn", labelAr: "statEditionsLabelAr" },
                  { key: "Delegates", defaultEn: "Delegates", defaultAr: "المشاركون",
                    num: "statDelegates", labelEn: "statDelegatesLabelEn", labelAr: "statDelegatesLabelAr" },
                  { key: "Faculty", defaultEn: "Faculty", defaultAr: "المتحدثون",
                    num: "statFaculty", labelEn: "statFacultyLabelEn", labelAr: "statFacultyLabelAr" },
                  { key: "CME Hours", defaultEn: "CME Hours", defaultAr: "ساعات معتمدة",
                    num: "statCmeHours", labelEn: "statCmeHoursLabelEn", labelAr: "statCmeHoursLabelAr" },
                  { key: "Countries", defaultEn: "Countries", defaultAr: "الدول",
                    num: "statCountries", labelEn: "statCountriesLabelEn", labelAr: "statCountriesLabelAr" },
                ] as const).map((s) => (
                  <div key={s.key} className="grid md:grid-cols-3 gap-4 p-4 border border-border/40 rounded-sm">
                    <FormField control={form.control} name={s.num} render={({ field }) => (
                      <FormItem><FormLabel>{s.defaultEn} — {t("Number", "الرقم")}</FormLabel><FormControl><Input {...field} dir="ltr" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={s.labelEn} render={({ field }) => (
                      <FormItem><FormLabel>{t("Label (EN)", "التسمية (EN)")}</FormLabel><FormControl><Input {...field} placeholder={s.defaultEn} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={s.labelAr} render={({ field }) => (
                      <FormItem><FormLabel>{t("Label (AR)", "التسمية (AR)")}</FormLabel><FormControl><Input {...field} dir="rtl" placeholder={s.defaultAr} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                ))}
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
                  <FormField control={form.control} name="venueImageUrl" render={({ field }) => (
                    <FormItem>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        label={t("Venue Image", "صورة المكان")}
                        hint={t(
                          "Shown in the Venue & Contact section on the home page. Wide landscape works best.",
                          "تظهر في قسم المكان والتواصل بالصفحة الرئيسية. تعمل الصور الأفقية العريضة بشكل أفضل."
                        )}
                        previewClassName="w-32 h-20"
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="aboutImageUrl" render={({ field }) => (
                    <FormItem>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        label={t("About / The Congress Image", "صورة قسم عن المؤتمر")}
                        hint={t(
                          "Portrait image shown next to the About AIVEC section. Tall (3:4) works best.",
                          "صورة عمودية تظهر بجانب قسم عن المؤتمر. تعمل النسبة 3:4 بشكل أفضل."
                        )}
                        previewClassName="w-20 h-28"
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="quoteImageUrl" render={({ field }) => (
                    <FormItem>
                      <ImageUploadField
                        value={field.value}
                        onChange={field.onChange}
                        label={t("Quote / Banner Image", "صورة الاقتباس")}
                        hint={t(
                          "Full-width background behind the \"Advancing vascular care…\" quote. Wide landscape works best.",
                          "خلفية عرضية خلف اقتباس «النهوض برعاية الأوعية الدموية…». الصور الأفقية الواسعة أفضل."
                        )}
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

function ContactPhonesField() {
  const { control } = useFormContext<SettingsFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "contactPhones" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Phone numbers</div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ number: "", whatsapp: false })}
        >
          <Plus className="w-4 h-4 mr-1" /> Add phone
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">No phone numbers yet. Click "Add phone".</p>
      )}
      <div className="space-y-3">
        {fields.map((f, index) => (
          <div key={f.id} className="flex items-start gap-3 p-3 border rounded-md">
            <div className="flex-1 grid gap-2">
              <FormField
                control={control}
                name={`contactPhones.${index}.number` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} dir="ltr" placeholder="+967 ..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`contactPhones.${index}.whatsapp` as const}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        id={`contact-phone-whatsapp-${index}`}
                        checked={field.value === true}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel htmlFor={`contact-phone-whatsapp-${index}`} className="text-sm font-normal cursor-pointer">
                      Show WhatsApp icon for this number
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label="Remove phone"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactEmailsField() {
  const { control } = useFormContext<SettingsFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "contactEmails" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Emails</div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ value: "" })}
        >
          <Plus className="w-4 h-4 mr-1" /> Add email
        </Button>
      </div>
      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">No emails yet. Click "Add email".</p>
      )}
      <div className="space-y-2">
        {fields.map((f, index) => (
          <div key={f.id} className="flex items-start gap-2">
            <FormField
              control={control}
              name={`contactEmails.${index}.value` as const}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...field} dir="ltr" placeholder="name@example.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              aria-label="Remove email"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
