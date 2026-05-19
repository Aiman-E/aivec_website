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
                    {settings?.contactEmails ? (
                      settings.contactEmails.map(email => (
                        <p key={email} className="text-xl font-medium text-foreground font-sans">{email}</p>
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
                  <p className="text-xl font-medium text-foreground font-sans" dir="ltr">
                    {settings?.contactPhone || "+967 777 907 147"}
                  </p>
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
