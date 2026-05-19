import { useLanguage } from "@/lib/i18n";
import { useGetEvent, useRegisterForEvent, getGetEventQueryKey } from "@workspace/api-client-react";
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
  const isRtl = lang === 'ar';

  const { data: eventData, isLoading } = useGetEvent(slug, { query: { enabled: !!slug, queryKey: getGetEventQueryKey(slug) } as never });
  const registerForEvent = useRegisterForEvent();

  const formSchema = z.record(z.any()); 
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-32 max-w-5xl">
        <Skeleton className="h-8 w-32 mb-12" />
        <Skeleton className="h-20 w-3/4 mb-6" />
        <Skeleton className="h-8 w-1/2 mb-12" />
        <div className="grid md:grid-cols-3 gap-16">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="md:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="container mx-auto px-6 py-40 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <h1 className="text-4xl font-serif text-muted-foreground mb-8">{t("Session not found.", "الجلسة غير موجودة.")}</h1>
        <Link href={`/${lang}/#program`}>
          <Button variant="outline" size="lg" className="rounded-none font-bold uppercase tracking-widest text-xs px-8 h-14">{t("Back to Program", "العودة للبرنامج")}</Button>
        </Link>
      </div>
    );
  }

  const { event, fields } = eventData;
  const Arrow = lang === 'ar' ? ArrowRight : ArrowLeft;
  const isRegistrationOpen = event.status === 'open';

  function onSubmit(answers: any) {
    registerForEvent.mutate(
      { id: event.id, data: { answers } } as never,
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
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-32 pt-28">
      <section className="bg-card border-b border-border py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5 mix-blend-overlay">
           <img src="/texture-ultrasound.png" alt="Texture" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-6 md:px-12 max-w-6xl relative z-10">
          <Link href={`/${lang}/#program`} className="inline-flex items-center text-xs font-bold text-muted-foreground hover:text-primary mb-12 transition-colors uppercase tracking-[0.2em]">
            <Arrow className="w-4 h-4 mr-3 rtl:ml-3 rtl:mr-0" />
            {t("Back to Program", "العودة للبرنامج")}
          </Link>

          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-4 mb-8">
              <span className={`inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 border ${
                event.status === 'open' ? 'border-primary text-primary bg-primary/5' :
                event.status === 'coming_soon' ? 'border-accent text-accent bg-accent/5' :
                'border-border text-muted-foreground bg-muted'
              }`}>
                {event.status.replace('_', ' ')}
              </span>
              {event.featured && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 border border-secondary text-secondary bg-secondary/5">
                  {t("Featured", "مميز")}
                </span>
              )}
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-8 leading-[0.9] tracking-tighter">
              {t(event.titleEn, event.titleAr)}
            </h1>
            
            <p className="text-2xl md:text-3xl text-primary font-serif italic mb-12 border-l-4 border-accent pl-8 rtl:pl-0 rtl:border-l-0 rtl:border-r-4 rtl:pr-8 py-2">
              {t(event.summaryEn, event.summaryAr)}
            </p>

            <div className="grid sm:grid-cols-3 gap-8 text-sm font-mono tracking-wider border-t border-border pt-8">
              {event.startsAt && (
                <>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">{t("Date", "التاريخ")}</div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{format(new Date(event.startsAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">{t("Time", "الوقت")}</div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <span dir="ltr">{format(new Date(event.startsAt), "HH:mm")}</span>
                    </div>
                  </div>
                </>
              )}
              {event.venueEn && (
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">{t("Venue", "المكان")}</div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{t(event.venueEn, event.venueAr)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 md:px-12 max-w-6xl mt-20">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          <div className="lg:col-span-7 xl:col-span-8">
            {event.posterUrl && (
              <div className="mb-16 border border-border bg-card p-3 shadow-2xl relative">
                <img src={event.posterUrl} alt="" className="w-full h-auto object-cover max-h-[700px] filter contrast-125" />
              </div>
            )}

            <div className="prose prose-xl dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-foreground prose-a:text-primary prose-p:leading-relaxed prose-p:text-muted-foreground">
              <div className="whitespace-pre-wrap">
                {t(event.bodyEn, event.bodyAr)}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 xl:col-span-4 relative">
            <div className="border border-border bg-card p-8 md:p-10 sticky top-32 shadow-xl">
              <h3 className="font-serif text-3xl font-bold mb-8 text-foreground border-b border-border pb-6 flex items-center gap-4">
                <span className="w-8 h-px bg-primary block"></span>
                {t("Registration", "التسجيل")}
              </h3>
              
              {!isRegistrationOpen ? (
                <div className="py-12 text-center bg-muted/30 border border-dashed border-border/50 p-8">
                  <p className="text-muted-foreground font-serif italic text-lg">
                    {t("Registration is not open for this session.", "التسجيل غير متاح لهذه الجلسة.")}
                  </p>
                </div>
              ) : (
                <>
                  {!isSignedIn ? (
                    <div className="py-8">
                      <p className="mb-8 text-muted-foreground leading-relaxed">
                        {t("You must sign in or create an account to register for sessions.", "يجب تسجيل الدخول أو إنشاء حساب للتسجيل في الجلسات.")}
                      </p>
                      <SignInButton mode="modal">
                        <Button size="lg" className="w-full rounded-none h-14 font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90">
                          {t("Sign In to Register", "تسجيل الدخول للتسجيل")}
                        </Button>
                      </SignInButton>
                    </div>
                  ) : (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {fields.map((field) => (
                          <FormField
                            key={field.fieldKey}
                            control={form.control}
                            name={field.fieldKey as never}
                            rules={{ required: field.required }}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                  {t(field.labelEn, field.labelAr)}
                                  {field.required && <span className="text-primary">*</span>}
                                </FormLabel>
                                <FormControl>
                                  {field.fieldType === 'short_text' || field.fieldType === 'email' || field.fieldType === 'phone' || field.fieldType === 'number' ? (
                                    <Input 
                                      type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'} 
                                      placeholder={t(field.placeholderEn, field.placeholderAr)} 
                                      className="rounded-none bg-background focus-visible:ring-primary border-border h-12"
                                      {...formField} 
                                    />
                                  ) : field.fieldType === 'long_text' ? (
                                    <Textarea 
                                      placeholder={t(field.placeholderEn, field.placeholderAr)} 
                                      className="rounded-none bg-background focus-visible:ring-primary border-border min-h-[120px]"
                                      {...formField} 
                                    />
                                  ) : field.fieldType === 'dropdown' && field.options ? (
                                    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                      <FormControl>
                                        <SelectTrigger className="rounded-none bg-background focus:ring-primary border-border h-12">
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
                                    <RadioGroup onValueChange={formField.onChange} defaultValue={formField.value} className="flex flex-col space-y-3 mt-4">
                                      {field.options.map(opt => (
                                        <FormItem key={opt.value} className="flex items-center space-x-3 space-x-reverse space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value={opt.value} className="border-border text-primary" />
                                          </FormControl>
                                          <FormLabel className="font-serif text-foreground cursor-pointer text-base">
                                            {t(opt.labelEn, opt.labelAr)}
                                          </FormLabel>
                                        </FormItem>
                                      ))}
                                    </RadioGroup>
                                  ) : field.fieldType === 'checkbox' ? (
                                    <div className="flex items-start space-x-3 space-x-reverse mt-4">
                                      <FormControl>
                                        <Checkbox 
                                          checked={formField.value} 
                                          onCheckedChange={formField.onChange} 
                                          className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                        />
                                      </FormControl>
                                      <FormDescription className="mt-0 text-base font-serif text-foreground leading-relaxed">
                                        {t(field.placeholderEn, field.placeholderAr)}
                                      </FormDescription>
                                    </div>
                                  ) : (
                                    <Input className="rounded-none h-12" {...formField} />
                                  )}
                                </FormControl>
                                {field.helpEn && <p className="text-xs text-muted-foreground mt-2 font-serif italic">{t(field.helpEn, field.helpAr)}</p>}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                        <Button type="submit" size="lg" className="w-full rounded-none mt-12 h-14 font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 group" disabled={registerForEvent.isPending}>
                          {registerForEvent.isPending ? t("Processing...", "جاري المعالجة...") : (
                            <span className="flex items-center gap-3">
                              {t("Confirm Registration", "تأكيد التسجيل")}
                              <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                            </span>
                          )}
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