import { useLanguage } from "@/lib/i18n";
import { useGetSiteSettings, useCreateContactSubmission } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useMemo } from "react";

type ContactFormValues = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
};

export function Contact() {
  const { lang, t } = useLanguage();
  const { data: settings } = useGetSiteSettings();
  const { toast } = useToast();
  const createContact = useCreateContactSubmission();

  // Build the schema per-render so validation errors are in the current
  // language. Cheap to recreate; only changes when language changes.
  const contactSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("Name is required", "الاسم مطلوب")),
        email: z.string().email(t("A valid email is required", "البريد الإلكتروني غير صالح")),
        phone: z.string().optional(),
        subject: z.string().optional(),
        message: z.string().min(1, t("Message is required", "الرسالة مطلوبة")),
      }),
    // Rebuild only when the active language changes so validation
    // messages match the UI; the `t` identity is unstable per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lang]
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  function onSubmit(data: ContactFormValues) {
    createContact.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: t("Inquiry Submitted", "تم إرسال الاستفسار"),
            description: t("Our team will review your message and respond shortly.", "سيقوم فريقنا بمراجعة رسالتك والرد قريباً."),
          });
          form.reset();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: t("Submission Failed", "فشل الإرسال"),
            description: t("There was an error sending your message. Please try again.", "حدث خطأ أثناء إرسال رسالتك. يرجى المحاولة مرة أخرى."),
          });
        }
      }
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <section className="relative py-20 lg:py-32 border-b border-border/10 bg-card">
        <div className="absolute inset-0 bg-[url('/hero-aden.png')] bg-cover bg-center opacity-5 pointer-events-none mix-blend-luminosity"></div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[2px] bg-primary"></span>
              <span className="text-primary font-bold uppercase tracking-widest text-sm">
                {t("Inquiries", "استفسارات")}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
              {t("Contact the Organizers", "التواصل مع المنظمين")}
            </h1>
            
            <p className="text-xl text-muted-foreground font-serif italic">
              {t("For academic inquiries, sponsorship opportunities, or registration support.", "للاستفسارات الأكاديمية أو فرص الرعاية أو دعم التسجيل.")}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24">
            
            <motion.div 
              className="lg:col-span-5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-serif font-bold mb-8 text-foreground">
                {t("Direct Contact", "التواصل المباشر")}
              </h2>
              
              <div className="space-y-10">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {t("Email", "البريد الإلكتروني")}
                  </h3>
                  <div className="space-y-2">
                    {settings?.contactEmails && settings.contactEmails.length > 0 ? (
                      settings.contactEmails.map(email => (
                        <a
                          key={email}
                          href={`mailto:${email}`}
                          className="block text-xl font-medium text-foreground font-sans hover:text-primary transition-colors"
                          dir="ltr"
                        >
                          {email}
                        </a>
                      ))
                    ) : (
                      <>
                        <p className="text-xl font-medium text-foreground font-sans">alameriendo@gmail.com</p>
                        <p className="text-xl font-medium text-foreground font-sans">alameri_karim@yahoo.com</p>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="h-px w-12 bg-border"></div>
                
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {t("Phone & WhatsApp", "الهاتف وواتساب")}
                  </h3>
                  <div className="space-y-2">
                    {(() => {
                      let phones: { number: string; whatsapp: boolean }[];
                      if (settings?.contactPhones && settings.contactPhones.length > 0) {
                        phones = settings.contactPhones;
                      } else {
                        const legacy: { number: string; whatsapp: boolean }[] = [];
                        const phone = settings?.contactPhone?.trim();
                        const wa = settings?.contactWhatsapp?.trim();
                        if (phone) legacy.push({ number: phone, whatsapp: !!wa && wa === phone });
                        if (wa && wa !== phone) legacy.push({ number: wa, whatsapp: true });
                        phones = legacy.length > 0 ? legacy : [{ number: "+967 777 907 147", whatsapp: true }];
                      }
                      return phones.map((p, i) => {
                        const digits = p.number.replace(/[^\d]/g, "");
                        return (
                          <div key={`${p.number}-${i}`} className="flex items-center gap-3" dir="ltr">
                            <a
                              href={`tel:${p.number.replace(/\s+/g, "")}`}
                              className="text-xl font-medium text-foreground font-sans hover:text-primary transition-colors"
                            >
                              {p.number}
                            </a>
                            {p.whatsapp && (
                              <a
                                href={`https://wa.me/${digits}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`WhatsApp ${p.number}`}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#25D366] text-white hover:opacity-90 transition-opacity"
                              >
                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.04 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 01-1.511-5.26c.002-5.45 4.436-9.884 9.889-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                              </a>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="h-px w-12 bg-border"></div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {t("Venue", "المكان")}
                  </h3>
                  <p className="text-lg text-foreground font-medium mb-1">
                    {t(settings?.venueNameEn || "Saba Grand Hall", settings?.venueNameAr || "قاعة سبأ الكبرى")}
                  </p>
                  <p className="text-muted-foreground">
                    {t("Khormaksar, Aden", "خورمكسر، عدن")}<br />
                    {t("Republic of Yemen", "الجمهورية اليمنية")}
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="lg:col-span-7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="bg-card border border-border p-8 md:p-12">
                <h2 className="text-2xl font-serif font-bold mb-8 text-foreground">
                  {t("Send an Inquiry", "إرسال استفسار")}
                </h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">{t("Full Name", "الاسم الكامل")}</FormLabel>
                            <FormControl>
                              <Input className="rounded-none bg-background focus-visible:ring-primary h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">{t("Email Address", "البريد الإلكتروني")}</FormLabel>
                            <FormControl>
                              <Input type="email" className="rounded-none bg-background focus-visible:ring-primary h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">{t("Phone (Optional)", "الهاتف (اختياري)")}</FormLabel>
                            <FormControl>
                              <Input className="rounded-none bg-background focus-visible:ring-primary h-12" dir="ltr" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">{t("Subject (Optional)", "الموضوع (اختياري)")}</FormLabel>
                            <FormControl>
                              <Input className="rounded-none bg-background focus-visible:ring-primary h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">{t("Message", "الرسالة")}</FormLabel>
                          <FormControl>
                            <Textarea className="rounded-none bg-background focus-visible:ring-primary min-h-[150px] resize-y" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" size="lg" className="w-full rounded-none h-14 text-base font-bold mt-4" disabled={createContact.isPending}>
                      {createContact.isPending ? t("Submitting...", "جاري الإرسال...") : t("Submit Inquiry", "إرسال الاستفسار")}
                    </Button>
                  </form>
                </Form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
