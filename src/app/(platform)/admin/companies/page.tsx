import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { CompaniesTable } from "@/features/admin/components/companies-table";
import { listPlatformCompanies } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Companies · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const statusRaw = first(params.status) || "all";
  const status =
    statusRaw === "active" || statusRaw === "inactive" || statusRaw === "all"
      ? statusRaw
      : "all";
  const page = Number(first(params.page) || "1");

  const result = await listPlatformCompanies({
    search,
    status,
    page: Number.isFinite(page) ? page : 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage tenant organizations across the Proven platform."
      />
      <CompaniesTable
        result={result.data}
        error={result.error}
        filters={{ search, status }}
      />
    </div>
  );
}
