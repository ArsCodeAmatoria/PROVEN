"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Forklift, Plus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { EQUIPMENT_QUALIFICATION_STATUS_LABELS } from "@/features/equipment-qualifications/constants";
import type { EquipmentQualificationListItem } from "@/services/equipment-qualifications.service";
import type { PaginatedResult } from "@/types";
import { formatDate } from "@/utils/format";

interface EquipmentQualificationListProps {
  result: PaginatedResult<EquipmentQualificationListItem> | null;
  error: string | null;
  canManage: boolean;
  filters: {
    q?: string;
    employeeId?: string;
    equipmentTypeId?: string;
    status?: string;
  };
  employees: { id: string; label: string }[];
  equipmentTypes: { id: string; label: string }[];
}

export function EquipmentQualificationList({
  result,
  error,
  canManage,
  filters,
  employees,
  equipmentTypes,
}: EquipmentQualificationListProps) {
  const router = useRouter();

  function updateFilters(next: Partial<typeof filters>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.employeeId) params.set("employeeId", merged.employeeId);
    if (merged.equipmentTypeId) {
      params.set("equipmentTypeId", merged.equipmentTypeId);
    }
    if (merged.status) params.set("status", merged.status);
    const query = params.toString();
    router.push(
      query
        ? `/equipment-qualifications?${query}`
        : "/equipment-qualifications",
    );
  }

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load qualifications</CardTitle>
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
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Equipment qualifications</CardTitle>
              <CardDescription>
                Worker endorsements by equipment class, make, model, and capacity.
              </CardDescription>
            </div>
            {canManage ? (
              <Button asChild size="sm">
                <Link href="/equipment-qualifications/new">
                  <Plus className="size-4" />
                  Add qualification
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateFilters({
                q: String(form.get("q") || "") || undefined,
              });
            }}
          >
            <Input
              name="q"
              placeholder="Search make, model, worker…"
              defaultValue={filters.q ?? ""}
            />
            <Select
              value={filters.employeeId ?? "__all__"}
              onValueChange={(value) =>
                updateFilters({
                  employeeId: value === "__all__" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Worker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All workers</SelectItem>
                {employees.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.equipmentTypeId ?? "__all__"}
              onValueChange={(value) =>
                updateFilters({
                  equipmentTypeId: value === "__all__" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Equipment class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All classes</SelectItem>
                {equipmentTypes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status ?? "__all__"}
              onValueChange={(value) =>
                updateFilters({
                  status: value === "__all__" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                {Object.entries(EQUIPMENT_QUALIFICATION_STATUS_LABELS).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </form>

          {items.length === 0 ? (
            <EmptyState
              icon={Forklift}
              title="No equipment qualifications"
              description="Qualify workers on tower cranes, mobile cranes, telehandlers, excavators, and more."
            />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/equipment-qualifications/${item.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.employee.name} · {item.equipmentType.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          `${item.make} ${item.model}`,
                          item.capacity,
                          `Qualified ${formatDate(item.qualifiedAt)}`,
                          item.expiresAt
                            ? `Expires ${formatDate(item.expiresAt)}`
                            : null,
                          item.assessor
                            ? `Assessor ${item.assessor.name}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={
                          item.displayStatus === "ACTIVE"
                            ? "success"
                            : item.displayStatus === "EXPIRED"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {
                          EQUIPMENT_QUALIFICATION_STATUS_LABELS[
                            item.displayStatus as keyof typeof EQUIPMENT_QUALIFICATION_STATUS_LABELS
                          ]
                        }
                      </Badge>
                      {item.assessmentCount > 0 ? (
                        <Badge variant="secondary">
                          {item.assessmentCount} assessments
                        </Badge>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {pageCount > 1 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() =>
                    router.push(
                      `/equipment-qualifications?${new URLSearchParams({
                        ...Object.fromEntries(
                          Object.entries(filters).filter(([, v]) => Boolean(v)),
                        ),
                        page: String(page - 1),
                      }).toString()}`,
                    )
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount}
                  onClick={() =>
                    router.push(
                      `/equipment-qualifications?${new URLSearchParams({
                        ...Object.fromEntries(
                          Object.entries(filters).filter(([, v]) => Boolean(v)),
                        ),
                        page: String(page + 1),
                      }).toString()}`,
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
