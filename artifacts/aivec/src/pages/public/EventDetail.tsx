import { useLanguage } from "@/lib/i18n";
import { useGetEvent, useRegisterForEvent } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Calendar, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SignInButton, useUser } from "@clerk/react";

export function EventDetail() {
  const { lang, t } = useLanguage();
  const [, params] = useRoute("/:lang/events/:slug");
  const slug = params?.slug || "";
  const { toast } = useToast();
  const { isSignedIn } = useUser();

  const { data: eventData, isLoading } = useGetEvent(slug);

  const registerForEvent = useRegisterForEvent();

  // We build a dynamic zod schema based on the event fields
  const formSchema = z.record(z.any()); // Simplification, in a real app we'd map fields to proper zod validation
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Skeleton className="h-8 w-24 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-24 w-full mb-8" />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-serif text-muted-foreground">{t("Event not found.", "الفعالية غير موجودة.")}</h1>
        <Link href={`/${lang}/events`} className="text-primary hover:underline mt-4 inline-block">
          {t("Back to Events", "العودة للفعاليات")}
        </Link>
      </div>
    );
  }

  const { event, fields } = eventData;
  const BackIcon = lang === 'ar' ? ChevronRight : ChevronLeft;

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
            title: t("Error", "خطأ"),
            description: t("Registration failed. You might already be registered.", "فشل التسجيل. قد تكون مسجلاً بالفعل."),
          });
        }
      }
    );
  }

  const isRegistrationOpen = event.status === 'open';

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <Link href={`/${lang}/events`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <BackIcon className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
        {t("Back to Events", "العودة للفعاليات")}
      </Link>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div>
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${
              event.status === 'open' ? 'bg-secondary/10 text-secondary' :
              event.status === 'coming_soon' ? 'bg-accent/10 text-accent' :
              'bg-muted text-muted-foreground'
            }`}>
              {event.status.replace('_', ' ').toUpperCase()}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
              {t(event.titleEn, event.titleAr)}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t(event.summaryEn, event.summaryAr)}
            </p>
          </div>

          {(event.startsAt || event.venueEn) && (
            <div className="flex flex-col sm:flex-row gap-4 py-6 border-y">
              {event.startsAt && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t("Date & Time", "التاريخ والوقت")}</div>
                    <div className="text-sm text-muted-foreground">{format(new Date(event.startsAt), "PPp")}</div>
                  </div>
                </div>
              )}
              {event.venueEn && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t("Venue", "المكان")}</div>
                    <div className="text-sm text-muted-foreground">{t(event.venueEn, event.venueAr)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {event.posterUrl && (
            <div className="rounded-lg overflow-hidden border bg-muted">
              <img src={event.posterUrl} alt="" className="w-full h-auto object-cover" />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
            {t(event.bodyEn, event.bodyAr)}
          </div>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-xl font-serif">
                {t("Registration", "التسجيل")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!isRegistrationOpen ? (
                <div className="text-center py-6 text-muted-foreground">
                  {t("Registration is not open for this event.", "التسجيل غير متاح لهذه الفعالية.")}
                </div>
              ) : (
                <>
                  {!isSignedIn && (
                    <div className="text-center py-6">
                      <p className="mb-4 text-muted-foreground">
                        {t("You must be signed in to register.", "يجب تسجيل الدخول للتسجيل.")}
                      </p>
                      <SignInButton mode="modal">
                        <Button className="w-full">{t("Sign In to Register", "تسجيل الدخول للتسجيل")}</Button>
                      </SignInButton>
                    </div>
                  )}
                  {isSignedIn && (
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
                                <FormLabel>
                                  {t(field.labelEn, field.labelAr)}
                                  {field.required && <span className="text-destructive ml-1">*</span>}
                                </FormLabel>
                                <FormControl>
                                  {field.fieldType === 'short_text' || field.fieldType === 'email' || field.fieldType === 'phone' || field.fieldType === 'number' ? (
                                    <Input 
                                      type={field.fieldType === 'email' ? 'email' : field.fieldType === 'number' ? 'number' : 'text'} 
                                      placeholder={t(field.placeholderEn, field.placeholderAr)} 
                                      {...formField} 
                                    />
                                  ) : field.fieldType === 'long_text' ? (
                                    <Textarea 
                                      placeholder={t(field.placeholderEn, field.placeholderAr)} 
                                      {...formField} 
                                    />
                                  ) : field.fieldType === 'dropdown' && field.options ? (
                                    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder={t(field.placeholderEn, field.placeholderAr)} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {field.options.map(opt => (
                                          <SelectItem key={opt.value} value={opt.value}>
                                            {t(opt.labelEn, opt.labelAr)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : field.fieldType === 'radio' && field.options ? (
                                    <RadioGroup onValueChange={formField.onChange} defaultValue={formField.value} className="flex flex-col space-y-1">
                                      {field.options.map(opt => (
                                        <FormItem key={opt.value} className="flex items-center space-x-2 space-y-0">
                                          <FormControl>
                                            <RadioGroupItem value={opt.value} />
                                          </FormControl>
                                          <FormLabel className="font-normal cursor-pointer">
                                            {t(opt.labelEn, opt.labelAr)}
                                          </FormLabel>
                                        </FormItem>
                                      ))}
                                    </RadioGroup>
                                  ) : field.fieldType === 'checkbox' ? (
                                    <div className="flex items-center space-x-2">
                                      <Checkbox 
                                        checked={formField.value} 
                                        onCheckedChange={formField.onChange} 
                                      />
                                    </div>
                                  ) : (
                                    <Input {...formField} />
                                  )}
                                </FormControl>
                                {field.helpEn && <p className="text-xs text-muted-foreground">{t(field.helpEn, field.helpAr)}</p>}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                        <Button type="submit" className="w-full" disabled={registerForEvent.isPending}>
                          {registerForEvent.isPending ? t("Submitting...", "جاري التسجيل...") : t("Submit Registration", "تأكيد التسجيل")}
                        </Button>
                      </form>
                    </Form>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
