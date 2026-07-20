import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { listPlatformDocuments } from "@/services/admin.service";
import { formatDate } from "@/utils/format";

export const metadata: Metadata = {
  title: "Documents · Platform Admin",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDocumentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = first(params.search)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listPlatformDocuments({
    search,
    page: Number.isFinite(page) ? page : 1,
  });

  const items = result.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Uploaded documents across all tenants."
      />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : (
        <DataTableShell
          columns={[
            { key: "title", header: "Document" },
            { key: "company", header: "Company" },
            { key: "entity", header: "Entity" },
            { key: "mime", header: "Type" },
            { key: "created", header: "Uploaded" },
          ]}
          empty={items.length === 0}
          emptyIcon={FileText}
          emptyTitle="No documents found"
          emptyDescription="No document records match this search."
          toolbar={
            <form method="get" className="flex gap-2">
              <Input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search documents…"
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
              basePath="/admin/documents"
              searchParams={{ search }}
            />
          }
        >
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-muted/30">
              <td className="px-4 py-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  {item.title}
                </a>
              </td>
              <td className="px-4 py-3">{item.company.name}</td>
              <td className="px-4 py-3">
                <Badge variant="outline">{item.entityType}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.mimeType ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(item.createdAt)}
              </td>
            </tr>
          ))}
        </DataTableShell>
      )}
    </div>
  );
}
