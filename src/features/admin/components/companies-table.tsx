"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import type { PlatformCompanyListItem } from "@/services/admin.service";
import type { PaginatedResult } from "@/types";
import { formatDate } from "@/utils/format";

interface CompaniesTableProps {
  result: PaginatedResult<PlatformCompanyListItem> | null;
  error?: string | null;
  filters: {
    search?: string;
    status?: string;
  };
}

export function CompaniesTable({
  result,
  error,
  filters,
}: CompaniesTableProps) {
  if (error) {
    return (
      <p className="text-sm text-destructive">Unable to load companies: {error}</p>
    );
  }

  const items = result?.items ?? [];
  const page = result?.page ?? 1;
  const pageCount = result?.pageCount ?? 1;
  const total = result?.total ?? 0;

  return (
    <DataTableShell
      columns={[
        { key: "name", header: "Company" },
        { key: "status", header: "Status" },
        { key: "workers", header: "Workers", className: "text-right" },
        { key: "users", header: "Users", className: "text-right" },
        { key: "created", header: "Created" },
        { key: "actions", header: "" },
      ]}
      empty={items.length === 0}
      emptyIcon={Building2}
      emptyTitle="No companies found"
      emptyDescription="Create a company or adjust your search filters."
      toolbar={
        <form
          method="get"
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Search companies…"
            className="sm:max-w-xs"
          />
          <select
            name="status"
            defaultValue={filters.status ?? "all"}
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-40"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          <Button type="button" variant="outline" asChild className="sm:ml-auto">
            <Link href="/admin/companies/new">New company</Link>
          </Button>
        </form>
      }
      footer={
        <DataTablePager
          page={page}
          pageCount={pageCount}
          total={total}
          basePath="/admin/companies"
          searchParams={{
            search: filters.search,
            status: filters.status === "all" ? undefined : filters.status,
          }}
        />
      }
    >
      {items.map((company) => (
        <tr key={company.id} className="hover:bg-muted/30">
          <td className="px-4 py-3">
            <Link
              href={`/admin/companies/${company.id}`}
              className="font-medium hover:underline"
            >
              {company.name}
            </Link>
            <p className="text-xs text-muted-foreground">{company.slug}</p>
          </td>
          <td className="px-4 py-3">
            <Badge variant={company.isActive ? "success" : "secondary"}>
              {company.isActive ? "Active" : "Inactive"}
            </Badge>
          </td>
          <td className="px-4 py-3 text-right tabular-nums">
            {company.workerCount}
          </td>
          <td className="px-4 py-3 text-right tabular-nums">
            {company.userCount}
          </td>
          <td className="px-4 py-3 text-muted-foreground">
            {formatDate(company.createdAt)}
          </td>
          <td className="px-4 py-3 text-right">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/companies/${company.id}/edit`}>Edit</Link>
            </Button>
          </td>
        </tr>
      ))}
    </DataTableShell>
  );
}
