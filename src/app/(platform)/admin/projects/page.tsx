import type { Metadata } from "next";
import { FolderKanban } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { listPlatformProjects } from "@/services/admin.service";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = {
  title: "Projects · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listPlatformProjects({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  const items = result.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Projects and assignments across tenant companies."
      />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <DataTableShell
          columns={[
            { key: "name", header: "Project" },
            { key: "company", header: "Company" },
            { key: "status", header: "Status" },
            { key: "assignments", header: "Assignments", className: "text-right" },
            { key: "dates", header: "Dates" },
          ]}
          empty={items.length === 0}
          emptyIcon={FolderKanban}
          emptyTitle="No projects found"
          emptyDescription="No project records match this search."
          toolbar={
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search projects…"
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
              basePath="/admin/projects"
              searchParams={{ search }}
            />
          }
        >
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.code}</p>
              </td>
              <td className="px-4 py-3">{item.company.name}</td>
              <td className="px-4 py-3">
                <Badge variant="outline">{item.status}</Badge>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {item._count.assignments}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(item.startDate)} – {formatDate(item.endDate)}
              </td>
            </tr>
          ))}
        </DataTableShell>
      )}
    </div>
  );
}
