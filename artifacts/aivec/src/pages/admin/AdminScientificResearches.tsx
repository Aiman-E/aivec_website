import { useLanguage } from "@/lib/i18n";
import {
  useListScientificResearches,
  useDeleteScientificResearch,
  getListScientificResearchesQueryKey,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, Download, Eye } from "lucide-react";
import { resolveImageUrl } from "@/components/admin/ImageUploadField";

function formatBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function AdminScientificResearches() {
  const { t, lang } = useLanguage();
  const { data: items } = useListScientificResearches();
  const del = useDeleteScientificResearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif">{t("Scientific Researches", "الأبحاث العلمية")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "Papers and abstracts submitted by signed-in users from the home page.",
              "الأوراق البحثية والملخصات المقدمة من المستخدمين المسجلين عبر الصفحة الرئيسية."
            )}
          </p>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Title", "العنوان")}</TableHead>
                <TableHead>{t("Uploader", "المُرسل")}</TableHead>
                <TableHead>{t("File", "الملف")}</TableHead>
                <TableHead>{t("Submitted", "تاريخ الإرسال")}</TableHead>
                <TableHead className="text-right">{t("Actions", "إجراءات")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.length ? (
                items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{it.title || "—"}</div>
                      {it.abstract && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                              <Eye className="w-3 h-3" />
                              {t("View abstract", "عرض الملخص")}
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{it.title || t("Abstract", "الملخص")}</DialogTitle>
                            </DialogHeader>
                            <div className="text-sm whitespace-pre-wrap max-h-[60vh] overflow-y-auto pr-2">
                              {it.abstract}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{it.uploaderName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{it.uploaderEmail || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={resolveImageUrl(it.fileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        title={it.fileName}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[200px]">{it.fileName || t("Download", "تحميل")}</span>
                      </a>
                      <div className="text-xs text-muted-foreground mt-0.5">{formatBytes(it.fileSize)}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(it.createdAt).toLocaleString(lang === "ar" ? "ar" : "en")}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        title={t("Delete", "حذف")}
                        onClick={() => {
                          if (confirm(t("Delete this submission?", "هل تريد حذف هذا الإرسال؟"))) {
                            del.mutate(
                              { id: it.id },
                              {
                                onSuccess: () => {
                                  toast({ title: t("Deleted", "تم الحذف") });
                                  queryClient.invalidateQueries({
                                    queryKey: getListScientificResearchesQueryKey(),
                                  });
                                },
                              }
                            );
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {t("No submissions yet.", "لا توجد إرسالات حتى الآن.")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
