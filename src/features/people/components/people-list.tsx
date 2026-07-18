"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Plus, Search, Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPLOYEE_STATUS_LABELS,
  employeePhotoUrl,
} from "@/features/people/constants";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { EmployeeListItem } from "@/services/people.service";
import type { PaginatedResult } from "@/types";
import { formatDate, fullName, getInitials } from "@/utils/format";

interface PeopleListProps {
  result: PaginatedResult<EmployeeListItem> | null;
  error?: string | null;
  trades: string[];
  supervisors: { id: string; label: string }[];
  canManage: boolean;
  filters: {
    q?: string;
    status?: string;
    trade?: string;
    level?: string;
    supervisorId?: string;
  };
}

export function PeopleList({
  result,
  error,
  trades,
  supervisors,
  canManage,
  filters,
}: PeopleListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const updateFilters = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    });
    if (!("page" in patch)) params.delete("page");
    startTransition(() => {
      router.push(`/people?${params.toString()}`);
    });
  };

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load employees</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const items = result?.items ?? [];
  const page = result?.page ?? 1;
  const pageCount = result?.pageCount ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form
          className="flex flex-1 flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            updateFilters({ q: String(formData.get("q") || "") });
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Search name, email, or employee number"
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            Search
          </Button>
        </form>

        {canManage ? (
          <Button asChild>
            <Link href="/people/new">
              <Plus className="mr-2 h-4 w-4" />
              Add employee
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => updateFilters({ status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.trade || "all"}
          onValueChange={(value) => updateFilters({ trade: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Trade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All trades</SelectItem>
            {trades.map((trade) => (
              <SelectItem key={trade} value={trade}>
                {trade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.level || "all"}
          onValueChange={(value) => updateFilters({ level: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {[1, 2, 3, 4, 5].map((level) => (
              <SelectItem key={level} value={String(level)}>
                Level {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.supervisorId || "all"}
          onValueChange={(value) => updateFilters({ supervisorId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Supervisor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All supervisors</SelectItem>
            {supervisors.map((supervisor) => (
              <SelectItem key={supervisor.id} value={supervisor.id}>
                {supervisor.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try adjusting filters, or add an employee to this company."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((employee) => {
            const photo = employeePhotoUrl(employee);
            return (
              <Link
                key={employee.id}
                href={`/people/${employee.id}`}
                className="block rounded-lg outline-none ring-offset-background transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="shadow-none">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    <Avatar>
                      {photo ? <AvatarImage src={photo} alt="" /> : null}
                      <AvatarFallback>
                        {getInitials(
                          employee.user.firstName,
                          employee.user.lastName,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">
                          {fullName(
                            employee.user.firstName,
                            employee.user.lastName,
                          )}
                        </CardTitle>
                        <Badge variant="secondary">
                          {EMPLOYEE_STATUS_LABELS[employee.status]}
                        </Badge>
                        <Badge variant="outline">
                          {ROLE_LABELS[employee.role]}
                        </Badge>
                      </div>
                      <CardDescription className="truncate">
                        {[
                          employee.employeeNumber
                            ? `#${employee.employeeNumber}`
                            : null,
                          employee.trade,
                          employee.trade ? `L${employee.level}` : null,
                          employee.company.name,
                          employee.supervisor
                            ? `Sup: ${fullName(
                                employee.supervisor.user.firstName,
                                employee.supervisor.user.lastName,
                              )}`
                            : null,
                          formatDate(employee.hireDate),
                          `${employee.totalHours.toLocaleString()} hrs`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount} · {result?.total ?? 0} employees
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || pending}
              onClick={() => updateFilters({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount || pending}
              onClick={() => updateFilters({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
