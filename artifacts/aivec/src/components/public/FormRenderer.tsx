import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpload } from "@workspace/object-storage-web";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { resolveImageUrl } from "@/components/admin/ImageUploadField";

export interface RendererFieldOption {
  value: string;
  labelEn: string;
  labelAr: string;
}

export interface RendererField {
  fieldKey: string;
  fieldType: string;
  labelEn?: string;
  labelAr?: string;
  helpEn?: string | null;
  helpAr?: string | null;
  placeholderEn?: string | null;
  placeholderAr?: string | null;
  required?: boolean | null;
  options?: RendererFieldOption[] | null;
}

interface FormRendererProps {
  fields: RendererField[];
  onSubmit: (answers: Record<string, unknown>) => void;
  submitting?: boolean;
  submitLabel?: string;
  uploadBasePath?: string;
}

export function FormRenderer({
  fields,
  onSubmit,
  submitting,
  submitLabel,
  uploadBasePath,
}: FormRendererProps) {
  const { t } = useLanguage();
  const form = useForm({ defaultValues: {} });

  const buildRules = (field: RendererField) => {
    const rules: Record<string, unknown> = {
      required: field.required
        ? t("This field is required", "هذا الحقل مطلوب")
        : false,
    };
    if (field.fieldType === "email") {
      rules.pattern = {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: t("Please enter a valid email address", "يرجى إدخال بريد إلكتروني صالح"),
      };
    } else if (field.fieldType === "phone") {
      rules.pattern = {
        value: /^[+\d][\d\s\-()]{5,}$/,
        message: t("Please enter a valid phone number", "يرجى إدخال رقم هاتف صالح"),
      };
    } else if (field.fieldType === "number") {
      rules.pattern = {
        value: /^-?\d+(\.\d+)?$/,
        message: t("Please enter a number", "يرجى إدخال رقم"),
      };
    }
    return rules;
  };

  function handleSubmit(values: Record<string, unknown>) {
    const cleaned: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.fieldType === "section_heading" || f.fieldType === "description_text") continue;
      cleaned[f.fieldKey] = values[f.fieldKey];
    }
    onSubmit(cleaned);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {fields.map((field, idx) => {
          if (field.fieldType === "section_heading") {
            return (
              <div key={idx} className="pt-4 first:pt-0">
                <div className="font-serif text-2xl font-bold border-b border-border pb-3">
                  {t(field.labelEn, field.labelAr)}
                </div>
                {field.helpEn && (
                  <p className="text-sm text-muted-foreground mt-2">{t(field.helpEn, field.helpAr || "")}</p>
                )}
              </div>
            );
          }
          if (field.fieldType === "description_text") {
            return (
              <div key={idx} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-serif italic border-l-2 border-border pl-4 rtl:pl-0 rtl:border-l-0 rtl:border-r-2 rtl:pr-4">
                {field.labelEn && (
                  <div className="font-bold not-italic text-foreground mb-1">{t(field.labelEn, field.labelAr)}</div>
                )}
                {t(field.helpEn || "", field.helpAr || "")}
              </div>
            );
          }
          return (
            <FormField
              key={field.fieldKey}
              control={form.control}
              name={field.fieldKey as never}
              rules={buildRules(field)}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    {t(field.labelEn, field.labelAr)}
                    {field.required && <span className="text-primary">*</span>}
                  </FormLabel>
                  <FormControl>
                    {field.fieldType === "short_text" || field.fieldType === "email" || field.fieldType === "phone" || field.fieldType === "number" ? (
                      <Input
                        type={field.fieldType === "email" ? "email" : field.fieldType === "number" ? "number" : "text"}
                        placeholder={t(field.placeholderEn || "", field.placeholderAr || "")}
                        className="rounded-none bg-background focus-visible:ring-primary border-border h-12"
                        {...formField}
                        value={(formField.value as string) ?? ""}
                      />
                    ) : field.fieldType === "long_text" ? (
                      <Textarea
                        placeholder={t(field.placeholderEn || "", field.placeholderAr || "")}
                        className="rounded-none bg-background focus-visible:ring-primary border-border min-h-[120px]"
                        {...formField}
                        value={(formField.value as string) ?? ""}
                      />
                    ) : field.fieldType === "date" ? (
                      <Input
                        type="date"
                        className="rounded-none bg-background focus-visible:ring-primary border-border h-12"
                        {...formField}
                        value={(formField.value as string) ?? ""}
                      />
                    ) : field.fieldType === "dropdown" && field.options ? (
                      <Select onValueChange={formField.onChange} value={(formField.value as string) ?? ""}>
                        <SelectTrigger className="rounded-none bg-background focus:ring-primary border-border h-12">
                          <SelectValue placeholder={t(field.placeholderEn || "", field.placeholderAr || "")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                          {field.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="rounded-none">
                              {t(opt.labelEn, opt.labelAr)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : field.fieldType === "radio" && field.options ? (
                      <RadioGroup onValueChange={formField.onChange} value={(formField.value as string) ?? ""} className="flex flex-col space-y-3 mt-4">
                        {field.options.map((opt) => (
                          <div key={opt.value} className="flex items-center space-x-3 space-x-reverse">
                            <RadioGroupItem id={`${field.fieldKey}-${opt.value}`} value={opt.value} className="border-border text-primary" />
                            <label htmlFor={`${field.fieldKey}-${opt.value}`} className="font-serif text-foreground cursor-pointer text-base">
                              {t(opt.labelEn, opt.labelAr)}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : field.fieldType === "checkbox" && field.options && field.options.length > 0 ? (
                      <MultiCheckboxField
                        options={field.options}
                        value={Array.isArray(formField.value) ? (formField.value as string[]) : []}
                        onChange={formField.onChange}
                      />
                    ) : field.fieldType === "checkbox" ? (
                      <div className="flex items-start space-x-3 space-x-reverse mt-2">
                        <Checkbox
                          checked={!!formField.value}
                          onCheckedChange={formField.onChange}
                          className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                        <span className="text-base font-serif text-foreground leading-relaxed">
                          {t(field.placeholderEn || "", field.placeholderAr || "")}
                        </span>
                      </div>
                    ) : field.fieldType === "yes_no" ? (
                      <div className="flex items-center gap-3 mt-2">
                        <Switch checked={!!formField.value} onCheckedChange={formField.onChange} />
                        <span className="text-sm text-muted-foreground">{formField.value ? t("Yes", "نعم") : t("No", "لا")}</span>
                      </div>
                    ) : field.fieldType === "image_upload" ? (
                      <UploadField
                        kind="image"
                        value={(formField.value as string) ?? ""}
                        onChange={formField.onChange}
                        basePath={uploadBasePath}
                      />
                    ) : field.fieldType === "file_upload" ? (
                      <UploadField
                        kind="file"
                        value={(formField.value as string) ?? ""}
                        onChange={formField.onChange}
                        basePath={uploadBasePath}
                      />
                    ) : (
                      <Input
                        className="rounded-none h-12"
                        {...formField}
                        value={(formField.value as string) ?? ""}
                      />
                    )}
                  </FormControl>
                  {field.helpEn && (
                    <p className="text-xs text-muted-foreground mt-2 font-serif italic">
                      {t(field.helpEn, field.helpAr || "")}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-none mt-12 h-14 font-bold text-xs uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={submitting}
        >
          {submitting ? t("Processing...", "جاري المعالجة...") : submitLabel || t("Submit", "إرسال")}
        </Button>
      </form>
    </Form>
  );
}

function MultiCheckboxField({
  options,
  value,
  onChange,
}: {
  options: RendererFieldOption[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const { t } = useLanguage();
  const toggle = (v: string, checked: boolean) => {
    const set = new Set(value || []);
    if (checked) set.add(v);
    else set.delete(v);
    onChange(Array.from(set));
  };
  return (
    <div className="flex flex-col space-y-3 mt-4">
      {options.map((opt) => {
        const id = `${opt.value}-cb`;
        const checked = value?.includes(opt.value) ?? false;
        return (
          <div key={opt.value} className="flex items-center space-x-3 space-x-reverse">
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(c) => toggle(opt.value, c === true)}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label htmlFor={id} className="font-serif text-foreground cursor-pointer text-base">
              {t(opt.labelEn, opt.labelAr)}
            </label>
          </div>
        );
      })}
    </div>
  );
}

function UploadField({
  kind,
  value,
  onChange,
  basePath,
}: {
  kind: "image" | "file";
  value: string;
  onChange: (v: string) => void;
  basePath?: string;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    basePath,
    onSuccess: (res) => {
      onChange(res.objectPath);
      toast({ title: t("Upload complete", "تم الرفع") });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: t("Upload failed", "فشل الرفع"), description: err.message });
    },
  });

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    await uploadFile(file);
  };

  const accept = kind === "image" ? "image/*" : "application/pdf,.doc,.docx,.txt";
  const previewUrl = value ? resolveImageUrl(value) : null;

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-start gap-3">
        {kind === "image" && previewUrl ? (
          <div className="w-24 h-24 border border-border bg-muted overflow-hidden shrink-0">
            <img src={previewUrl} alt="" className="w-full h-full object-contain" />
          </div>
        ) : value ? (
          <div className="w-24 h-24 border border-border bg-muted flex items-center justify-center shrink-0">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
        ) : null}
        <div className="flex-1">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isUploading} className="rounded-none">
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {isUploading
              ? `${progress}%`
              : value
                ? t("Replace", "استبدال")
                : kind === "image"
                  ? t("Upload image", "ارفع صورة")
                  : t("Upload file", "ارفع ملف")}
          </Button>
          {value && !isUploading && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { onChange(""); setFileName(null); }}>
              <X className="w-4 h-4 mr-1" />
              {t("Remove", "إزالة")}
            </Button>
          )}
          {fileName && <p className="text-xs text-muted-foreground mt-2 truncate">{fileName}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handlePick} />
    </div>
  );
}
