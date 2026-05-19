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
import { Mail, Phone, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, "Message is required"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export function Contact() {
  const { lang, t } = useLanguage();
  const { data: settings } = useGetSiteSettings();
  const { toast } = useToast();
  
  const createContact = useCreateContactSubmission();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(data: ContactFormValues) {
    createContact.mutate(
      { data },
      {
        onSuccess: () => {
          toast({
            title: t("Message sent", "تم إرسال الرسالة"),
            description: t("We will get back to you shortly.", "سنقوم بالرد عليك قريباً."),
          });
          form.reset();
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: t("Error", "خطأ"),
            description: t("Failed to send message.", "فشل إرسال الرسالة."),
          });
        }
      }
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">
          {t("Contact Us", "اتصل بنا")}
        </h1>
        <p className="text-xl text-muted-foreground">
          {t("Have questions about AIVEC 2026? We're here to help.", "هل لديك أسئلة حول مؤتمر عدن الدولي ٢٠٢٦؟ نحن هنا للمساعدة.")}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t("Phone", "الهاتف")}</h3>
                <p className="text-muted-foreground text-sm" dir="ltr">{settings?.contactPhone || "+967 777 000 000"}</p>
                {settings?.contactWhatsapp && (
                  <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span dir="ltr">{settings.contactWhatsapp}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t("Email", "البريد الإلكتروني")}</h3>
                {settings?.contactEmails ? (
                  settings.contactEmails.map(email => (
                    <p key={email} className="text-muted-foreground text-sm mb-1">{email}</p>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">info@aivec.org</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6 md:p-8">
              <h2 className="text-2xl font-serif mb-6">{t("Send a Message", "إرسال رسالة")}</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Name", "الاسم")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>{t("Email", "البريد الإلكتروني")}</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Phone (Optional)", "الهاتف (اختياري)")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>{t("Subject (Optional)", "الموضوع (اختياري)")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                        <FormLabel>{t("Message", "الرسالة")}</FormLabel>
                        <FormControl>
                          <Textarea rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full md:w-auto" disabled={createContact.isPending}>
                    {createContact.isPending ? t("Sending...", "جاري الإرسال...") : t("Send Message", "إرسال الرسالة")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
