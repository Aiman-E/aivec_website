import { useLanguage, useLocaleTag } from "@/lib/i18n";
import { useRoute, Link } from "wouter";
import { useGetForm, useListFormSubmissions } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";
import { resolveImageUrl } from "@/components/admin/ImageUploadField";

interface SubmissionRow {
  id: number;
  formId: number;
  answers: unknown;
  submitterName?: string | null;
  submitterEmail?: string | null;
  createdAt: string;
}

export function AdminFormSubmissions() {
  const { lang, t } = useLanguage();
  const localeTag = useLocaleTag();
  const [, params] = useRoute("/:lang/admin/forms/:id/submissions");
  const formId = Number(params?.id);
  const { data: formData } = useGetForm(formId.toString(), { query: { enabled: !!formId } as never });
  const { data: submissions, isLoading } = useListFormSubmissions(formId, { query: { enabled: !!formId } as never });
  const [view, setView] = useState<SubmissionRow | null>(null);

  const fields = formData?.fields ?? [];
  const fieldByKey = new Map(fields.map((f) => [f.fieldKey, f]));

  const renderAnswer = (key: string, val: unknown): React.ReactNode => {
    const f = fieldByKey.get(key);
    if (val == null || val === "") return <span className="text-muted-foreground italic">—</span>;
    if (f?.fieldType === "image_upload" && typeof val === "string") {
      const url = resolveImageUrl(val);
      return <img src={url} alt="" className="max-w-xs max-h-48 border border-border" />;
    }
    if (f?.fieldType === "file_upload" && typeof val === "string") {
      const url = resolveImageUrl(val);
      return <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1"><Download className="w-3 h-3" />{t("Download file", "تنزيل الملف")}</a>;
    }
    if (f?.fieldType === "yes_no" || typeof val === "boolean") {
      return val ? t("Yes", "نعم") : t("No", "لا");
    }
    if (Array.isArray(val)) {
      return val.map((v) => {
        const opt = f?.options?.find((o) => o.value === v);
        return opt ? t(opt.labelEn, opt.labelAr) : String(v);
      }).join(", ");
    }
    if (f?.options) {
      const opt = f.options.find((o) => o.value === val);
      if (opt) return t(opt.labelEn, opt.labelAr);
    }
    return <span className="whitespace-pre-wrap">{String(val)}</span>;
  };

  const downloadCsv = () => {
    if (!submissions || submissions.length === 0) return;
    const cols = fields.filter((f) => f.fieldType !== "section_heading" && f.fieldType !== "description_text");
    const headers = ["id", "createdAt", "submitterName", "submitterEmail", ...cols.map((c) => c.fieldKey)];
    const escape = (v: unknown) => {
      const s = v == null ? "" : Array.isArray(v) ? v.join("|") : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = submissions.map((r) => {
      const ans = (r.answers ?? {}) as Record<string, unknown>;
      return [r.id, r.createdAt, r.submitterName ?? "", r.submitterEmail ?? "", ...cols.map((c) => escape(ans[c.fieldKey]))].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData?.form.slug ?? "form"}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const BackIcon = lang === "ar" ? ChevronRight : ChevronLeft;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <Link href={`/${lang}/admin/forms`} className="inline-flex items-center text-sm text-muted-foreground mb-2">
            <BackIcon className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
            {t("Back to Forms", "العودة للنماذج")}
          </Link>
          <h1 className="text-3xl font-serif">{t("Submissions", "الإرسالات")}{formData ? `: ${t(formData.form.titleEn, formData.form.titleAr)}` : ""}</h1>
        </div>
        <Button variant="outline" onClick={downloadCsv} disabled={!submissions || submissions.length === 0}>
          <Download className="w-4 h-4 mr-2" /> {t("Export CSV", "تصدير CSV")}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">{t("Loading...", "جاري التحميل...")}</div>
      ) : !submissions || submissions.length === 0 ? (
        <Card><div className="py-16 text-center text-muted-foreground">{t("No submissions yet.", "لا توجد إرسالات بعد.")}</div></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>{t("Name", "الاسم")}</TableHead>
                <TableHead>{t("Email", "البريد الإلكتروني")}</TableHead>
                <TableHead>{t("Date", "التاريخ")}</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell>{r.submitterName || "—"}</TableCell>
                  <TableCell>{r.submitterEmail || "—"}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString(localeTag)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setView(r as SubmissionRow)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("Submission", "الإرسال")} #{view?.id}</DialogTitle>
          </DialogHeader>
          {view && (
            <div className="space-y-4 text-sm">
              <div className="text-xs text-muted-foreground">{new Date(view.createdAt).toLocaleString(localeTag)}</div>
              {Object.entries((view.answers ?? {}) as Record<string, unknown>).map(([k, v]) => {
                const f = fieldByKey.get(k);
                return (
                  <div key={k} className="border-t pt-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">{f ? t(f.labelEn, f.labelAr) : k}</div>
                    <div>{renderAnswer(k, v)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
