import { useLanguage } from "@/lib/i18n";
import { useGetEvent, useRegisterForEvent } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar, MapPin, ArrowRight, ArrowLeft, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SignInButton, useUser } from "@clerk/react";
import { motion } from "framer-motion";

export function EventDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/:lang/events/:slug");
  const slug = params?.slug || "";
  const { toast } = useToast();
  const { isSignedIn } = useUser();

  const { data: eventData, isLoading } = useGetEvent(slug);
  const registerForEvent = useRegisterForEvent();

  const formSchema = z.record(z.any()); 
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-5xl">
        <Skeleton className="h-8 w-32 mb-12" />
        <Skeleton className="h-16 w-3/4 mb-6" />
        <Skeleton className="h-6 w-1/2 mb-12" />
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="md:col-span-1">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="container mx-auto px-4 py-32 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-serif text-muted-foreground mb-6">{t("Session not found.", "الجلسة غير موجودة.")}</h1>
        <Link href={`/${lang}/events`}>
          <Button variant="outline" size="lg" className="rounded-none">{t("Back to Program", "العودة للبرنامج")}</Button>
        </Link>
      </div>
    );
  }

  const { event, fields } = eventData;
  const Arrow = lang === 'ar' ? ArrowRight : ArrowLeft;
  const isRegistrationOpen = event.status === 'open';

  function onSubmit(answers: any) {
    registerForEvent.mutate(
      { id: event.id, data: { answers } },
      {
        onSuccess: () => {
          toast({
            title: t("Registration successful", "تم التسجيل بنجاح"),
            description: t("You have been registered for this event.", "لقد تم تسجيلك في هذه الفعالية."),
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: t("Registration failed", "فشل التسجيل"),
            description: t("There was an error processing your registration. You might already be registered.", "حدث خطأ أثناء معالجة تسجيلك. قد تكون مسجلاً بالفعل."),
          });
        }
      }
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24">
      <section className="bg-card border-b border-border/10 py-12 lg:py-20 relative">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-10">
          <Link href={`/${lang}/events`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-10 transition-colors uppercase tracking-wider">
            <Arrow className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t("Back to Program", "العودة للبرنامج")}
          </Link>

          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-3 mb-6">
              <span className={`inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm ${
                event.status === 'open' ? 'bg-secondary/10 text-secondary' :
                event.status === 'coming_soon' ? 'bg-accent/10 text-accent' :
                'bg-muted text-muted-foreground'
              }`}>
                {event.status.replace('_', ' ')}
              </span>
              {event.featured && (
                <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm bg-primary/10 text-primary">
                  {t("Featured", "مميز")}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
              {t(event.titleEn, event.titleAr)}
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-serif italic mb-10">
              {t(event.summaryEn, event.summaryAr)}
            </p>

            <div className="flex flex-wrap gap-8 text-sm font-medium">
              {event.startsAt && (
                <>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span>{format(new Date(event.startsAt), "MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span dir="ltr">{format(new Date(event.startsAt), "h:mm a")}</span>
                  </div>
                </>
              )}
              {event.venueEn && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{t(event.venueEn, event.venueAr)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-8 max-w-6xl mt-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-7 xl:col-span-8">
            {event.posterUrl && (
              <div className="mb-12 border border-border bg-muted p-2">
                <img src={event.posterUrl} alt="" className="w-full h-auto object-contain max-h-[500px]" />
              </div>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-a:text-primary">
              <div className="whitespace-pre-wrap">
                {t(event.bodyEn, event.bodyAr)}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4">
            <div className="border border-border bg-card p-6 md:p-8 sticky top-32">
              <h3 className="font-serif text-2xl font-bold mb-6 text-foreground border-b border-border/50 pb-4">
                {t("Registration", "التسجيل")}
              </h3>
              
              {!isRegistrationOpen ? (
                <div className="py-8 text-center bg-muted/30 border border-dashed border-border p-6">
                  <p className="text-muted-foreground font-medium">
                    {t("Registration is not open for this session.", "التسجيل غير متاح لهذه الجلسة.")}
                  </p>
                </div>
              ) : (
                <>
                  {!isSignedIn ? (
                    <div className="py-6">
                      <p className="mb-6 text-muted-foreground">
                        {t("You must sign in or create an account to register for sessions.", "يجب تسجيل الدخول أو إنشاء حساب للتسجيل في الجلسات.")}
                      </p>
                      <SignInButton mode="modal">
                        <Button size="lg" className="w-full rounded-none">{t("Sign In to Register", "تسجيل الدخول للتسجيل")}</Button>
                      </SignInButton>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {fields.map((field) => (
                          <FormField
                            key={field.fieldKey}
                            control={form.control}
                            name={field.fieldKey as never}
                            rules={{ required: field.required }}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel className="font-semibold text-foreground">
                                  {t(field.labelEn, field.labelAr)}
                                  {field.required && <span className="text-destructive ml-1">*</span>}
                                </FormLabel>
                                <FormControl>
                                  {field.fieldType === 'short_text' || field.fieldType === 'email' || field.fieldType === 'phone' || field.fieldType === 'number' ? (
                                    <Input 
                                      type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'} 
                                      placeholder={t(field.placeholderEn, field.placeholderAr)} 
                                      className="rounded-none bg-background focus-visible:ring-primary"
                                      {...formField} 
                                    />
                                  ) : field.fieldType === 'long_text' ? (
                                    <Textarea 
                                      placeholder={t(field.placeholderEn, field.placeholderAr)} 
                                      className="rounded-none bg-background focus-visible:ring-primary min-h-[100px]"
                                      {...formField} 
                                    />
                                  ) : field.fieldType === 'dropdown' && field.options ? (
                                    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                      <FormControl>
                                        <SelectTrigger className="rounded-none bg-background focus:ring-primary">
                                          <SelectValue placeholder={t(field.placeholderEn, field.placeholderAr)} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="rounded-none">
                                        {field.options.map(opt => (
                                          <SelectItem key={opt.value} value={opt.value} className="rounded-none">
                                            {t(opt.labelEn, opt.labelAr)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : field.fieldType === 'radio' && field.options ? (
                                    <RadioGroup onValueChange={formField.onChange} defaultValue={formField.value} className="flex flex-col space-y-2 mt-2">
                                      {field.options.map(opt => (
                                        <FormItem key={opt.value} className="flex items-center space-x-3 space-x-reverse space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value={opt.value} />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer text-sm">
                                            {t(opt.labelEn, opt.labelAr)}
                                          </FormLabel>
                                        </FormItem>
                                      ))}
                                    </RadioGroup>
                                  ) : field.fieldType === 'checkbox' ? (
                                    <div className="flex items-center space-x-3 space-x-reverse mt-2">
                                      <FormControl>
                                        <Checkbox 
                                          checked={formField.value} 
                                          onCheckedChange={formField.onChange} 
                                        />
                                      </FormControl>
                                      <FormDescription className="mt-0 text-sm font-normal text-foreground">
                                        {t(field.placeholderEn, field.placeholderAr)}
                                      </FormDescription>
                                    </div>
                                  ) : (
                                    <Input className="rounded-none" {...formField} />
                                  )}
                                </FormControl>
                                {field.helpEn && <p className="text-xs text-muted-foreground mt-1.5">{t(field.helpEn, field.helpAr)}</p>}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                        <Button type="submit" size="lg" className="w-full rounded-none mt-8" disabled={registerForEvent.isPending}>
                          {registerForEvent.isPending ? t("Processing...", "جاري المعالجة...") : t("Confirm Registration", "تأكيد التسجيل")}
                        </Button>
                      </form>
                    </Form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
