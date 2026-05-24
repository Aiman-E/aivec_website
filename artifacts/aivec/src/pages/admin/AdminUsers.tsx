import { useLanguage, useLocaleTag } from "@/lib/i18n";
import { useListUsers, useUpdateUserRole } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function AdminUsers() {
  const { lang, t } = useLanguage();
  const localeTag = useLocaleTag();
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

  const handleExportCsv = () => {
    if (!users || users.length === 0) {
      toast({ title: "No users to export" });
      return;
    }
    const headers = ["id", "clerkId", "email", "firstName", "lastName", "role", "createdAt"];
    const lines = [headers.join(",")];
    for (const u of users) {
      lines.push([u.id, u.clerkId, u.email, u.firstName, u.lastName, u.role, u.createdAt].map(csvCell).join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aivec-users-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users?.length ?? 0} registered user{(users?.length ?? 0) === 1 ? "" : "s"}. Stored in your own database
            &mdash; export any time as a backup or to migrate off this host.
          </p>
        </div>
        <Button onClick={handleExportCsv} variant="outline" size="sm" disabled={!users || users.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
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
                <TableCell>{new Date(user.createdAt).toLocaleDateString(localeTag)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
