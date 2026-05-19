import { useLanguage } from "@/lib/i18n";
import { useListEventRegistrations, getListEventRegistrationsQueryKey, useUpdateRegistration } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function AdminEventRegistrations() {
  const { lang, t } = useLanguage();
  const [match, params] = useRoute("/:lang/admin/events/:id/registrations");
  const eventId = Number(params?.id);
  const { data: registrations, isLoading } = useListEventRegistrations(eventId, { query: { enabled: !!eventId } as never });
  const updateRegistration = useUpdateRegistration();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (id: number, status: string) => {
    updateRegistration.mutate({ id, data: { status: status as any } }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        queryClient.invalidateQueries({ queryKey: getListEventRegistrationsQueryKey(eventId) });
      }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">Registrations</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations?.map(reg => (
              <TableRow key={reg.id}>
                <TableCell>{reg.userName || 'N/A'}</TableCell>
                <TableCell>{reg.userEmail}</TableCell>
                <TableCell>
                  <Select defaultValue={reg.status} onValueChange={(v) => handleStatusChange(reg.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{new Date(reg.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
