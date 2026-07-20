import type { Metadata } from "next";
import { Eye } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { listPlatformObservations } from "@/services/admin.service";
import { formatDate, fullName } from "@/utils/format";

export const metadata: Metadata = {
  title: "Observations · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminObservationsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listPlatformObservations({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  const items = result.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Observations"
        description="Field observations across all companies."
      />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <DataTableShell
          columns={[
            { key: "context", header: "Observation" },
            { key: "company", header: "Company" },
            { key: "worker", header: "Worker" },
            { key: "type", header: "Type" },
            { key: "followUp", header: "Follow-up" },
            { key: "observed", header: "Observed" },
          ]}
          empty={items.length === 0}
          emptyIcon={Eye}
          emptyTitle="No observations found"
          emptyDescription="No observation records match this search."
          toolbar={
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search observations…"
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
              basePath="/admin/observations"
              searchParams={{ search }}
            />
          }
        >
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <p className="line-clamp-2 font-medium">{item.context}</p>
              </td>
              <td className="px-4 py-3">{item.company.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {fullName(
                  item.employee.user.firstName,
                  item.employee.user.lastName,
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline">{item.observationType}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.followUpStatus}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(item.observedAt)}
              </td>
            </tr>
          ))}
        </DataTableShell>
      )}
    </div>
  );
}
