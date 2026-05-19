import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";
import {
  useListForms,
  useCreateForm,
  useUpdateForm,
  useDeleteForm,
  getListFormsQueryKey,
} from "@workspace/api-client-react";
import type { Form as FormRow } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, ExternalLink, Pencil, Trash2, Wrench, Inbox, Copy } from "lucide-react";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

type FormStatus = "draft" | "open" | "closed";

interface FormDraft {
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  logoUrl: string | null;
  submitLabelEn: string;
  submitLabelAr: string;
  successMessageEn: string;
  successMessageAr: string;
  status: FormStatus;
}

const emptyDraft = (): FormDraft => ({
  slug: "",
  titleEn: "",
  titleAr: "",
  descriptionEn: "",
  descriptionAr: "",
  logoUrl: null,
  submitLabelEn: "Submit",
  submitLabelAr: "إرسال",
  successMessageEn: "Thank you. Your submission has been received.",
  successMessageAr: "شكراً لك. تم استلام إرسالك.",
  status: "draft",
});

type DialogState =
  | { kind: "closed" }
  | { kind: "create"; draft: FormDraft }
  | { kind: "edit"; id: number; draft: FormDraft }
  | { kind: "delete"; row: FormRow };

export function AdminForms() {
  const { lang, t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: forms, isLoading } = useListForms();
  const create = useCreateForm();
  const update = useUpdateForm();
  const del = useDeleteForm();
  const [dialog, setDialog] = useState<DialogState>({ kind: "closed" });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListFormsQueryKey() });

  const handleSave = () => {
    if (dialog.kind === "create") {
      create.mutate(
        { data: dialog.draft as never },
        {
          onSuccess: () => {
            toast({ title: t("Form created", "تم إنشاء النموذج") });
            invalidate();
            setDialog({ kind: "closed" });
          },
          onError: (err: unknown) => {
            const e = err as { response?: { data?: { error?: string } }; message?: string };
            toast({
              variant: "destructive",
              title: t("Failed to create form", "فشل الإنشاء"),
              description: e?.response?.data?.error || e?.message,
            });
          },
        },
      );
    } else if (dialog.kind === "edit") {
      update.mutate(
        { id: dialog.id, data: dialog.draft as never },
        {
          onSuccess: () => {
            toast({ title: t("Form updated", "تم التحديث") });
            invalidate();
            setDialog({ kind: "closed" });
          },
          onError: (err: unknown) => {
            const e = err as { response?: { data?: { error?: string } }; message?: string };
            toast({
              variant: "destructive",
              title: t("Failed to update", "فشل التحديث"),
              description: e?.response?.data?.error || e?.message,
            });
          },
        },
      );
    }
  };

  const handleDelete = () => {
    if (dialog.kind !== "delete") return;
    del.mutate(
      { id: dialog.row.id },
      {
        onSuccess: () => {
          toast({ title: t("Form deleted", "تم الحذف") });
          invalidate();
          setDialog({ kind: "closed" });
        },
      },
    );
  };

  const setDraft = (patch: Partial<FormDraft>) => {
    if (dialog.kind !== "create" && dialog.kind !== "edit") return;
    setDialog({ ...dialog, draft: { ...dialog.draft, ...patch } });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif">{t("Forms", "النماذج")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "Build any kind of public form. Submissions are stored here and viewable per form.",
              "أنشئ أي نموذج عام. يتم تخزين الإرسالات هنا وعرضها لكل نموذج.",
            )}
          </p>
        </div>
        <Button onClick={() => setDialog({ kind: "create", draft: emptyDraft() })}>
          <Plus className="w-4 h-4 mr-2" /> {t("New Form", "نموذج جديد")}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>
      ) : !forms || forms.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">{t("No forms yet.", "لا توجد نماذج بعد.")}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {forms.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-5 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <h3 className="font-serif text-xl">{t(f.titleEn, f.titleAr) || f.slug}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border ${f.status === "open" ? "border-primary text-primary bg-primary/5" : f.status === "closed" ? "border-muted-foreground/40 text-muted-foreground" : "border-border text-muted-foreground bg-muted"}`}>
                      {f.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-mono">
                    /{lang}/forms/{f.slug}
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${lang}/forms/${f.slug}`);
                        toast({ title: t("Link copied", "تم نسخ الرابط") });
                      }}
                      className="hover:text-foreground"
                      title={t("Copy public link", "نسخ الرابط العام")}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${lang}/admin/forms/${f.id}/fields`}><Wrench className="w-4 h-4 mr-1" />{t("Fields", "الحقول")}</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/${lang}/admin/forms/${f.id}/submissions`}><Inbox className="w-4 h-4 mr-1" />{t("Submissions", "الإرسالات")}</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/${lang}/forms/${f.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 mr-1" />{t("View", "عرض")}</a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDialog({
                        kind: "edit",
                        id: f.id,
                        draft: {
                          slug: f.slug,
                          titleEn: f.titleEn ?? "",
                          titleAr: f.titleAr ?? "",
                          descriptionEn: f.descriptionEn ?? "",
                          descriptionAr: f.descriptionAr ?? "",
                          logoUrl: f.logoUrl ?? null,
                          submitLabelEn: f.submitLabelEn ?? "Submit",
                          submitLabelAr: f.submitLabelAr ?? "إرسال",
                          successMessageEn: f.successMessageEn ?? "",
                          successMessageAr: f.successMessageAr ?? "",
                          status: (f.status as FormStatus) ?? "draft",
                        },
                      })
                    }
                  >
                    <Pencil className="w-4 h-4 mr-1" />{t("Edit", "تعديل")}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDialog({ kind: "delete", row: f })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog.kind === "create" || dialog.kind === "edit"} onOpenChange={(o) => !o && setDialog({ kind: "closed" })}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog.kind === "edit" ? t("Edit Form", "تعديل النموذج") : t("New Form", "نموذج جديد")}</DialogTitle>
            <DialogDescription>{t("Configure the form metadata. Build fields on the next screen.", "اضبط إعدادات النموذج. أنشئ الحقول من الشاشة التالية.")}</DialogDescription>
          </DialogHeader>
          {(dialog.kind === "create" || dialog.kind === "edit") && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Slug (URL)</Label><Input value={dialog.draft.slug} onChange={(e) => setDraft({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="contact, abstract-submission" /></div>
                <div className="space-y-2"><Label>{t("Status", "الحالة")}</Label>
                  <Select value={dialog.draft.status} onValueChange={(v) => setDraft({ status: v as FormStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft (hidden)</SelectItem>
                      <SelectItem value="open">Open (accepting submissions)</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Title (EN)</Label><Input value={dialog.draft.titleEn} onChange={(e) => setDraft({ titleEn: e.target.value })} /></div>
                <div className="space-y-2"><Label>Title (AR)</Label><Input value={dialog.draft.titleAr} onChange={(e) => setDraft({ titleAr: e.target.value })} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Description (EN)</Label><Textarea value={dialog.draft.descriptionEn} onChange={(e) => setDraft({ descriptionEn: e.target.value })} rows={3} /></div>
                <div className="space-y-2"><Label>Description (AR)</Label><Textarea value={dialog.draft.descriptionAr} onChange={(e) => setDraft({ descriptionAr: e.target.value })} rows={3} dir="rtl" /></div>
              </div>
              <ImageUploadField
                label={t("Form Logo", "شعار النموذج")}
                value={dialog.draft.logoUrl}
                onChange={(v) => setDraft({ logoUrl: v || null })}
                hint={t("Shown at the top of the public form.", "يظهر أعلى النموذج العام.")}
                previewClassName="w-24 h-24"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Submit Button (EN)</Label><Input value={dialog.draft.submitLabelEn} onChange={(e) => setDraft({ submitLabelEn: e.target.value })} /></div>
                <div className="space-y-2"><Label>Submit Button (AR)</Label><Input value={dialog.draft.submitLabelAr} onChange={(e) => setDraft({ submitLabelAr: e.target.value })} dir="rtl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Success Message (EN)</Label><Textarea value={dialog.draft.successMessageEn} onChange={(e) => setDraft({ successMessageEn: e.target.value })} rows={2} /></div>
                <div className="space-y-2"><Label>Success Message (AR)</Label><Textarea value={dialog.draft.successMessageAr} onChange={(e) => setDraft({ successMessageAr: e.target.value })} rows={2} dir="rtl" /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog({ kind: "closed" })}>{t("Cancel", "إلغاء")}</Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? t("Saving...", "جاري الحفظ...") : t("Save", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.kind === "delete"} onOpenChange={(o) => !o && setDialog({ kind: "closed" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete form?", "حذف النموذج؟")}</DialogTitle>
            <DialogDescription>{t("This will also delete all its fields and submissions. This cannot be undone.", "سيؤدي ذلك أيضاً إلى حذف جميع حقوله وإرسالاته. لا يمكن التراجع.")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog({ kind: "closed" })}>{t("Cancel", "إلغاء")}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={del.isPending}>{t("Delete", "حذف")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
