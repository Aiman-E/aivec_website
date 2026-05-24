import { useEffect, useState } from "react";
import { useUser, SignInButton } from "@clerk/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@workspace/object-storage-web";
import {
  useCreateScientificResearch,
  getListScientificResearchesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, LogIn, Loader2, CheckCircle2 } from "lucide-react";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPT_ATTR = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaperUploadDialog({ open, onOpenChange }: Props) {
  const { t, lang } = useLanguage();
  const isRtl = lang === "ar";
  const { isSignedIn, user, isLoaded } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [uploaderName, setUploaderName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { uploadFile, isUploading, progress } = useUpload({ basePath: "/api/storage/public" });
  const create = useCreateScientificResearch();

  useEffect(() => {
    if (open && isSignedIn && user && !uploaderName) {
      setUploaderName(user.fullName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "");
    }
  }, [open, isSignedIn, user, uploaderName]);

  useEffect(() => {
    if (!open) {
      setDone(false);
    }
  }, [open]);

  function resetForm() {
    setTitle("");
    setAbstract("");
    setFile(null);
    setDone(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSignedIn || !user) return;
    if (!file) {
      toast({ title: t("Please choose a file.", "يرجى اختيار ملف."), variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: t("File too large (max 10MB).", "الملف كبير جداً (الحد الأقصى 10 ميجابايت)."), variant: "destructive" });
      return;
    }
    if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: t("Only PDF or Word documents are allowed.", "يُسمح بملفات PDF أو Word فقط."), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const uploaded = await uploadFile(file);
      if (!uploaded) {
        throw new Error("Upload failed");
      }
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      await create.mutateAsync({
        data: {
          title: title.trim(),
          abstract: abstract.trim(),
          uploaderName: uploaderName.trim(),
          uploaderEmail: email,
          uploaderUserId: user.id,
          fileUrl: uploaded.objectPath,
          fileName: file.name,
          fileSize: file.size,
          fileContentType: file.type || "application/octet-stream",
        },
      });
      queryClient.invalidateQueries({ queryKey: getListScientificResearchesQueryKey() });
      setDone(true);
      resetForm();
      toast({ title: t("Submitted successfully", "تم الإرسال بنجاح") });
    } catch (err) {
      toast({
        title: t("Submission failed", "فشل الإرسال"),
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir={isRtl ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            {t("Submit Scientific Paper", "إرسال بحث علمي")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "Share your research with the AIVEC scientific committee.",
              "شارك بحثك مع اللجنة العلمية لمؤتمر AIVEC."
            )}
          </DialogDescription>
        </DialogHeader>

        {!isLoaded ? (
          <div className="py-10 text-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          </div>
        ) : !isSignedIn ? (
          <div className="py-6 space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {t("Please sign in first", "يرجى تسجيل الدخول أولاً")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t(
                  "You need an account to submit scientific papers.",
                  "تحتاج إلى حساب لإرسال الأبحاث العلمية."
                )}
              </p>
            </div>
            <SignInButton mode="modal">
              <Button className="w-full sm:w-auto">
                <LogIn className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {t("Sign In", "تسجيل الدخول")}
              </Button>
            </SignInButton>
          </div>
        ) : done ? (
          <div className="py-8 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-600" />
            <div>
              <p className="font-medium">{t("Thank you!", "شكراً لك!")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t(
                  "Your paper has been received. The committee will review it shortly.",
                  "تم استلام بحثك. ستقوم اللجنة بمراجعته قريباً."
                )}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setDone(false)}>
                {t("Submit another", "إرسال بحث آخر")}
              </Button>
              <Button onClick={() => onOpenChange(false)}>{t("Close", "إغلاق")}</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="paper-name">{t("Your name", "اسمك")}</Label>
              <Input
                id="paper-name"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                required
                dir={lang === "ar" ? "rtl" : "ltr"}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="paper-title">{t("Paper title", "عنوان البحث")}</Label>
              <Input
                id="paper-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                dir={lang === "ar" ? "rtl" : "ltr"}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="paper-abstract">{t("Abstract", "الملخص")}</Label>
              <Textarea
                id="paper-abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                required
                rows={6}
                dir={lang === "ar" ? "rtl" : "ltr"}
                className="mt-1.5 resize-y"
                placeholder={t(
                  "Briefly describe your research, methods, and findings…",
                  "صف بحثك ومنهجك ونتائجك بإيجاز…"
                )}
              />
            </div>
            <div>
              <Label htmlFor="paper-file">
                {t("Paper file (PDF or Word, max 10MB)", "ملف البحث (PDF أو Word، حد أقصى 10 ميجابايت)")}
              </Label>
              <label
                htmlFor="paper-file"
                className="mt-1.5 flex items-center gap-3 px-3 py-3 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted/40 transition-colors"
              >
                {file ? (
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                ) : (
                  <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm truncate">
                  {file ? file.name : t("Choose a file…", "اختر ملفاً…")}
                </span>
              </label>
              <input
                id="paper-file"
                type="file"
                accept={ACCEPT_ATTR}
                className="sr-only"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
              {isUploading && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {t("Uploading…", "جاري الرفع…")} {progress}%
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                {t("Cancel", "إلغاء")}
              </Button>
              <Button type="submit" disabled={submitting || isUploading}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />}
                {t("Submit", "إرسال")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
