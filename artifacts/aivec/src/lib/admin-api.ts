import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";

export type AdminSessionUser = {
  id: number;
  username: string;
  displayName: string | null;
  lastLoginAt?: string | null;
};

export type AdminAccount = {
  id: number;
  username: string;
  displayName: string | null;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type AdminActivity = {
  id: number;
  adminUserId: number | null;
  adminUsername: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  summary: string | null;
  details: unknown;
  createdAt: string;
};

async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : null) ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

const ADMIN_ME_KEY = ["admin", "me"] as const;
const ADMIN_ACCOUNTS_KEY = ["admin", "accounts"] as const;
const ADMIN_ACTIVITIES_KEY = ["admin", "activities"] as const;

export function useAdminMe(): UseQueryResult<AdminSessionUser | null> {
  return useQuery<AdminSessionUser | null>({
    queryKey: ADMIN_ME_KEY,
    queryFn: async () => {
      try {
        return await adminFetch<AdminSessionUser>("/admin/auth/me");
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useAdminLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      adminFetch<AdminSessionUser>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      qc.setQueryData(ADMIN_ME_KEY, data);
    },
  });
}

export function useAdminLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminFetch<{ ok: boolean }>("/admin/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(ADMIN_ME_KEY, null);
      qc.invalidateQueries();
    },
  });
}

export function useAdminAccounts() {
  return useQuery<AdminAccount[]>({
    queryKey: ADMIN_ACCOUNTS_KEY,
    queryFn: () => adminFetch<AdminAccount[]>("/admin/accounts"),
  });
}

export function useCreateAdminAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; password: string; displayName?: string }) =>
      adminFetch<AdminAccount>("/admin/accounts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_KEY }),
  });
}

export function useUpdateAdminAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: number;
      displayName?: string | null;
      password?: string;
      active?: boolean;
    }) => {
      const { id, ...rest } = input;
      return adminFetch<AdminAccount>(`/admin/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(rest),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_KEY }),
  });
}

export function useDeleteAdminAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      adminFetch<void>(`/admin/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_ACCOUNTS_KEY }),
  });
}

export function useAdminActivities(limit = 20) {
  return useQuery<AdminActivity[]>({
    queryKey: [...ADMIN_ACTIVITIES_KEY, limit],
    queryFn: () => adminFetch<AdminActivity[]>(`/admin/activities?limit=${limit}`),
    refetchOnWindowFocus: true,
  });
}
