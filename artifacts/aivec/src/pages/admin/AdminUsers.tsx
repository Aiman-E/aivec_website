import { useLanguage } from "@/lib/i18n";
import { useListUsers, useUpdateUserRole } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function AdminUsers() {
  const { lang, t } = useLanguage();
  const { data: users, refetch } = useListUsers();
  const updateRole = useUpdateUserRole();
  const { toast } = useToast();

  const handleRoleChange = (id: number, role: string) => {
    updateRole.mutate({ id, data: { role: role as any } }, {
      onSuccess: () => {
        toast({ title: "Role updated" });
        refetch();
      }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif">Users</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "N/A"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select defaultValue={user.role} onValueChange={(v) => handleRoleChange(user.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
