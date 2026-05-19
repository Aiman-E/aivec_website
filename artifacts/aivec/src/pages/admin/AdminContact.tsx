import { useLanguage, useLocaleTag } from "@/lib/i18n";
import { useListContactSubmissions, useDeleteContactSubmission } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminContact() {
  const { lang, t } = useLanguage();
  const localeTag = useLocaleTag();
  const { data: contacts, refetch } = useListContactSubmissions();
  const deleteContact = useDeleteContactSubmission();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    if (confirm(t("Delete this message?", "هل تريد حذف هذه الرسالة؟"))) {
      deleteContact.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Deleted" });
          refetch();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">Contact Submissions</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.map(contact => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.subject}</TableCell>
                <TableCell>{new Date(contact.createdAt).toLocaleDateString(localeTag)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="icon" className="text-destructive" onClick={() => handleDelete(contact.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
