import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { listPlatformCurriculum } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Curriculum · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminCurriculumPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listPlatformCurriculum({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  const items = result.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Curriculum"
        description="Pull LMS curricula across companies."
      />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <DataTableShell
          columns={[
            { key: "title", header: "Curriculum" },
            { key: "company", header: "Company" },
            { key: "modules", header: "Modules", className: "text-right" },
            { key: "enrolments", header: "Enrolments", className: "text-right" },
            { key: "status", header: "Status" },
          ]}
          empty={items.length === 0}
          emptyIcon={BookOpen}
          emptyTitle="No curricula found"
          emptyDescription="No curriculum records match this search."
          toolbar={
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search curriculum…"
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
              basePath="/admin/curriculum"
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
              <td className="px-4 py-3 text-muted-foreground">
                {item.company?.name ?? "Global"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {item._count.modules}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {item._count.enrolments}
              </td>
              <td className="px-4 py-3">
                <Badge variant={item.isActive ? "success" : "secondary"}>
                  {item.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </DataTableShell>
      )}
    </div>
  );
}
