import { useState } from "react";
import { useLanguage, useLocaleTag } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAdminAccounts,
  useCreateAdminAccount,
  useUpdateAdminAccount,
  useDeleteAdminAccount,
  useAdminMe,
  type AdminAccount,
} from "@/lib/admin-api";
import { UserPlus, Trash2, KeyRound, Power, PowerOff } from "lucide-react";

function NewAccountForm() {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const create = useCreateAdminAccount();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        username: username.trim(),
        password,
        displayName: displayName.trim() || undefined,
      });
      setUsername("");
      setPassword("");
      setDisplayName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {t("Create Admin Account", "إنشاء حساب إداري")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">{t("Username", "اسم المستخدم")}</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-sm bg-background text-sm"
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("Display Name", "اسم العرض")}</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-sm bg-background text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("Password", "كلمة المرور")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-sm bg-background text-sm"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {create.isPending ? t("Creating...", "جاري الإنشاء...") : t("Create", "إنشاء")}
          </button>
          {error && (
            <p className="md:col-span-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-sm px-3 py-2">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function AccountRow({ account, currentId }: { account: AdminAccount; currentId: number }) {
  const { t } = useLanguage();
  const localeTag = useLocaleTag();
  const update = useUpdateAdminAccount();
  const del = useDeleteAdminAccount();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isSelf = account.id === currentId;

  async function resetPassword() {
    setError(null);
    if (newPassword.length < 6) {
      setError(t("Password must be at least 6 characters", "يجب أن تكون كلمة المرور 6 أحرف على الأقل"));
      return;
    }
    try {
      await update.mutateAsync({ id: account.id, password: newPassword });
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function toggleActive() {
    setError(null);
    try {
      await update.mutateAsync({ id: account.id, active: !account.active });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  async function remove() {
    setError(null);
    if (!confirm(t(`Delete admin "${account.username}"?`, `حذف المسؤول "${account.username}"؟`))) return;
    try {
      await del.mutateAsync(account.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 px-3">
        <div className="font-medium text-sm">{account.username}</div>
        {account.displayName && (
          <div className="text-xs text-muted-foreground">{account.displayName}</div>
        )}
        {isSelf && (
          <span className="inline-block mt-1 text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">
            {t("you", "أنت")}
          </span>
        )}
      </td>
      <td className="py-3 px-3 text-sm">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs ${
          account.active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-muted text-muted-foreground"
        }`}>
          {account.active ? t("Active", "نشط") : t("Disabled", "معطل")}
        </span>
      </td>
      <td className="py-3 px-3 text-xs text-muted-foreground">
        {account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString(localeTag) : t("Never", "أبدًا")}
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="password"
              placeholder={t("New password", "كلمة مرور جديدة")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="px-2 py-1 text-xs border border-border rounded-sm bg-background w-32"
            />
            <button
              type="button"
              onClick={resetPassword}
              disabled={update.isPending || newPassword.length === 0}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-border rounded-sm hover:bg-muted disabled:opacity-60"
              title={t("Reset password", "إعادة تعيين كلمة المرور")}
            >
              <KeyRound className="w-3 h-3" />
            </button>
          </div>
          {!isSelf && (
            <>
              <button
                type="button"
                onClick={toggleActive}
                disabled={update.isPending}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-border rounded-sm hover:bg-muted disabled:opacity-60"
                title={account.active ? t("Disable", "تعطيل") : t("Enable", "تمكين")}
              >
                {account.active ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={del.isPending}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-destructive border border-destructive/40 rounded-sm hover:bg-destructive/10 disabled:opacity-60"
                title={t("Delete", "حذف")}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </td>
    </tr>
  );
}

export function AdminAccounts() {
  const { t } = useLanguage();
  const { data: me } = useAdminMe();
  const { data: accounts, isLoading } = useAdminAccounts();

  return (
    <div>
      <h1 className="text-3xl font-serif text-foreground mb-8">{t("Admin Accounts", "حسابات الإدارة")}</h1>
      <div className="space-y-6">
        <NewAccountForm />
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-serif">{t("All Admins", "جميع المسؤولين")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">{t("Loading...", "جاري التحميل...")}</p>
            ) : !accounts || accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("No admin accounts.", "لا توجد حسابات إدارية.")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="py-2 px-3 font-medium">{t("User", "المستخدم")}</th>
                      <th className="py-2 px-3 font-medium">{t("Status", "الحالة")}</th>
                      <th className="py-2 px-3 font-medium">{t("Last Login", "آخر تسجيل دخول")}</th>
                      <th className="py-2 px-3 font-medium">{t("Actions", "الإجراءات")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((a) => (
                      <AccountRow key={a.id} account={a} currentId={me?.id ?? -1} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
