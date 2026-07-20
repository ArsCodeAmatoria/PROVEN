import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { listPlatformAssessments } from "@/services/admin.service";
import { formatDate, fullName } from "@/utils/format";

export const metadata: Metadata = {
  title: "Assessments · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAssessmentsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listPlatformAssessments({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  const items = result.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        description="Cross-tenant assessment activity and status."
      />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <DataTableShell
          columns={[
            { key: "title", header: "Assessment" },
            { key: "company", header: "Company" },
            { key: "type", header: "Type" },
            { key: "status", header: "Status" },
            { key: "assessor", header: "Assessor" },
            { key: "scheduled", header: "Scheduled" },
          ]}
          empty={items.length === 0}
          emptyIcon={ClipboardCheck}
          emptyTitle="No assessments found"
          emptyDescription="No assessment records match this search."
          toolbar={
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search assessments…"
                className="max-w-sm"
              />
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          }
          footer={
            <DataTablePager
              page={result.data?.page ?? 1}
              pageCount={result.data?.pageCount ?? 1}
              total={result.data?.total ?? 0}
              basePath="/admin/assessments"
              searchParams={{ search }}
            />
          }
        >
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.competency?.title ?? "—"}
                </p>
              </td>
              <td className="px-4 py-3">{item.company.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.type}</td>
              <td className="px-4 py-3">
                <Badge variant="outline">{item.status}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.assessor
                  ? fullName(
                      item.assessor.user.firstName,
                      item.assessor.user.lastName,
                    )
                  : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(item.scheduledAt)}
              </td>
            </tr>
          ))}
        </DataTableShell>
      )}
    </div>
  );
}
