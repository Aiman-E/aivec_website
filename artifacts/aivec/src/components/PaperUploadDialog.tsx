import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { FileText } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaperUploadDialog({ open, onOpenChange }: Props) {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {t("Submit Scientific Paper", "إرسال بحث علمي")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Scientific paper submissions are unavailable online. Please contact the conference team for submission instructions.",
              "إرسال الأبحاث العلمية غير متاح إلكترونياً حالياً. يرجى التواصل مع فريق المؤتمر للحصول على تعليمات الإرسال.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 space-y-5 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(
              "The admin panel can still manage previously submitted research records.",
              "يمكن للوحة الإدارة الاستمرار في إدارة سجلات الأبحاث المرسلة سابقاً.",
            )}
          </p>
          <Button onClick={() => onOpenChange(false)} className="rounded-none">
            {t("Close", "إغلاق")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
