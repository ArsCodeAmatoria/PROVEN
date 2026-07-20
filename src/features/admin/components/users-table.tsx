"use client";

import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTablePager,
  DataTableShell,
} from "@/features/admin/components/data-table-shell";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { PlatformUserItem } from "@/services/admin.service";
import type { PaginatedResult } from "@/types";
import { formatRelative, fullName } from "@/utils/format";

interface UsersTableProps {
  result: PaginatedResult<PlatformUserItem> | null;
  error?: string | null;
  filters: {
    search?: string;
  };
}

export function UsersTable({ result, error, filters }: UsersTableProps) {
  if (error) {
    return (
      <p className="text-sm text-destructive">Unable to load users: {error}</p>
    );
  }

  const items = result?.items ?? [];
  const page = result?.page ?? 1;
  const pageCount = result?.pageCount ?? 1;
  const total = result?.total ?? 0;

  return (
    <DataTableShell
      columns={[
        { key: "name", header: "User" },
        { key: "role", header: "Role" },
        { key: "active", header: "Active" },
        { key: "login", header: "Last login" },
        { key: "companies", header: "Companies" },
      ]}
      empty={items.length === 0}
      emptyIcon={Users}
      emptyTitle="No users found"
      emptyDescription="Try a different search query."
      toolbar={
        <form method="get" className="flex flex-col gap-2 sm:flex-row">
          <Input
            name="search"
            defaultValue={filters.search ?? ""}
            placeholder="Search name or email…"
            className="sm:max-w-sm"
          />
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
          basePath="/admin/users"
          searchParams={{ search: filters.search }}
        />
      }
    >
      {items.map((user) => {
        const primary = user.employees[0];
        return (
          <tr key={user.id} className="hover:bg-muted/30">
            <td className="px-4 py-3">
              <p className="font-medium">
                {fullName(user.firstName, user.lastName)}
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </td>
            <td className="px-4 py-3">
              {primary
                ? (ROLE_LABELS[primary.role] ?? primary.role)
                : "—"}
            </td>
            <td className="px-4 py-3">
              <Badge variant={user.isActive ? "success" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {formatRelative(user.lastLoginAt)}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {user.employees.length === 0
                ? "—"
                : user.employees.map((e) => e.company.name).join(", ")}
            </td>
          </tr>
        );
      })}
    </DataTableShell>
  );
}
