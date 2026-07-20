import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { UsersTable } from "@/features/admin/components/users-table";
import { listPlatformUsers } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Users · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listPlatformUsers({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Platform identities with role, app access, and last login."
      />
      <UsersTable
        result={result.data}
        error={result.error}
        filters={{ search }}
      />
    </div>
  );
}
