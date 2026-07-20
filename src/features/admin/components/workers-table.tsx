"use client";

import { HardHat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { PlatformWorkerItem } from "@/services/admin.service";
import type { PaginatedResult } from "@/types";
import { fullName } from "@/utils/format";

interface WorkersTableProps {
  result: PaginatedResult<PlatformWorkerItem> | null;
  error?: string | null;
  filters: {
    search?: string;
    companyId?: string;
  };
  companies?: { id: string; name: string }[];
}

export function WorkersTable({
  result,
  error,
  filters,
  companies = [],
}: WorkersTableProps) {
  if (error) {
    return (
      <p className="text-sm text-destructive">Unable to load workers: {error}</p>
    );
  }

  const items = result?.items ?? [];
  const page = result?.page ?? 1;
  const pageCount = result?.pageCount ?? 1;
  const total = result?.total ?? 0;

  return (
    <DataTableShell
      columns={[
        { key: "name", header: "Worker" },
        { key: "number", header: "BC Crane Safety #" },
        { key: "company", header: "Company" },
        { key: "role", header: "Role" },
        { key: "status", header: "Status" },
      ]}
      empty={items.length === 0}
      emptyIcon={HardHat}
      emptyTitle="No workers found"
      emptyDescription="Try a different search or company filter."
      toolbar={
        <form
          method="get"
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <Input
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Search name, email, or employee number…"
            className="sm:max-w-sm"
          />
          {companies.length > 0 ? (
            <select
              name="companyId"
              defaultValue={filters.companyId ?? ""}
              className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:w-48"
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          ) : null}
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      }
      footer={
        <DataTablePager
          page={page}
          pageCount={pageCount}
          total={total}
          basePath="/admin/workers"
          searchParams={{
            search: filters.search,
            companyId: filters.companyId,
          }}
        />
      }
    >
      {items.map((worker) => (
        <tr key={worker.id} className="hover:bg-muted/30">
          <td className="px-4 py-3">
            <p className="font-medium">
              {fullName(worker.user.firstName, worker.user.lastName)}
            </p>
            <p className="text-xs text-muted-foreground">{worker.user.email}</p>
          </td>
          <td className="px-4 py-3 tabular-nums text-muted-foreground">
            {worker.employeeNumber ?? "—"}
          </td>
          <td className="px-4 py-3">{worker.company.name}</td>
          <td className="px-4 py-3">
            {ROLE_LABELS[worker.role] ?? worker.role}
          </td>
          <td className="px-4 py-3">
            <Badge
              variant={worker.status === "ACTIVE" ? "success" : "secondary"}
            >
              {worker.status}
            </Badge>
          </td>
        </tr>
      ))}
    </DataTableShell>
  );
}
