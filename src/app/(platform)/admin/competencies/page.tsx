import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { listPlatformCompetencies } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Competencies · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCompetenciesPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listPlatformCompetencies({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  const items = result.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competencies"
        description="Competency library across all tenant companies."
      />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <DataTableShell
          columns={[
            { key: "title", header: "Competency" },
            { key: "company", header: "Company" },
            { key: "category", header: "Category" },
            { key: "status", header: "Status" },
          ]}
          empty={items.length === 0}
          emptyIcon={BadgeCheck}
          emptyTitle="No competencies found"
          emptyDescription="No competency records match this search."
          toolbar={
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search competencies…"
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
              basePath="/admin/competencies"
              searchParams={{ search }}
            />
          }
        >
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.code}</p>
              </td>
              <td className="px-4 py-3">{item.company.name}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.category?.name ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline">{item.status}</Badge>
              </td>
            </tr>
          ))}
        </DataTableShell>
      )}
    </div>
  );
}
