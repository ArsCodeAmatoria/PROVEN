import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { WorkersTable } from "@/features/admin/components/workers-table";
import {
  listPlatformCompanies,
  listPlatformWorkers,
} from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Workers · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminWorkersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const companyId = first(params.companyId)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const [workers, companies] = await Promise.all([
    listPlatformWorkers({
      search,
      companyId,
      page: Number.isFinite(page) ? page : 1,
    }),
    listPlatformCompanies({ pageSize: 100, status: "all" }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workers"
        description="Cross-tenant employee directory with BC Crane Safety / employee numbers."
      />
      <WorkersTable
        result={workers.data}
        error={workers.error}
        filters={{ search, companyId }}
        companies={(companies.data?.items ?? []).map((c) => ({
          id: c.id,
          name: c.name,
        }))}
      />
    </div>
  );
}
