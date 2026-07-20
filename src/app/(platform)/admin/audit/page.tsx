import type { Metadata } from "next";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { listPlatformAuditLogs } from "@/services/admin.service";
import { formatRelative } from "@/utils/format";

export const metadata: Metadata = {
  title: "Audit Log · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listPlatformAuditLogs({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  const items = result.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit log"
        description="Platform mutation history across companies."
      />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <DataTableShell
          columns={[
            { key: "action", header: "Action" },
            { key: "entity", header: "Entity" },
            { key: "company", header: "Company" },
            { key: "summary", header: "Summary" },
            { key: "when", header: "When" },
          ]}
          empty={items.length === 0}
          emptyIcon={ScrollText}
          emptyTitle="No audit events"
          emptyDescription="Audit events will appear here as mutations occur."
          toolbar={
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search audit log…"
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
              basePath="/admin/audit"
              searchParams={{ search }}
            />
          }
        >
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <Badge variant="outline">{item.action}</Badge>
              </td>
              <td className="px-4 py-3 font-medium">{item.entityType}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.company?.name ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.summary ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatRelative(item.createdAt)}
              </td>
            </tr>
          ))}
        </DataTableShell>
      )}
    </div>
  );
}
