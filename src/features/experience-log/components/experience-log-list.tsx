"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, Plus } from "lucide-react";

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
import { LIFT_TYPE_LABELS } from "@/features/experience-log/constants";
import type {
  ExperienceLogListItem,
  ExperienceMilestoneProgress,
  ExperienceTotals,
} from "@/services/experience-log.service";
import type { PaginatedResult } from "@/types";
import { formatDate } from "@/utils/format";

interface ExperienceLogListProps {
  result: PaginatedResult<ExperienceLogListItem> | null;
  error: string | null;
  canManage: boolean;
  totals: ExperienceTotals | null;
  milestones: ExperienceMilestoneProgress[];
  filters: {
    q?: string;
    employeeId?: string;
    projectId?: string;
    liftType?: string;
    from?: string;
    to?: string;
  };
  employees: { id: string; label: string }[];
  projects: { id: string; label: string }[];
}

export function ExperienceLogList({
  result,
  error,
  canManage,
  totals,
  milestones,
  filters,
  employees,
  projects,
}: ExperienceLogListProps) {
  const router = useRouter();

  function updateFilters(next: Partial<typeof filters>) {
    const params = new URLSearchParams();
    const merged = { ...filters, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.employeeId) params.set("employeeId", merged.employeeId);
    if (merged.projectId) params.set("projectId", merged.projectId);
    if (merged.liftType) params.set("liftType", merged.liftType);
    if (merged.from) params.set("from", merged.from);
    if (merged.to) params.set("to", merged.to);
    const query = params.toString();
    router.push(query ? `/experience-log?${query}` : "/experience-log");
  }

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load experience log</CardTitle>
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
      {totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total hours"
            value={totals.totalHours.toFixed(1)}
          />
          <SummaryCard
            label="Apprenticeship hours"
            value={totals.apprenticeshipHours.toFixed(1)}
          />
          <SummaryCard
            label="Equipment hours"
            value={totals.equipmentHours.toFixed(1)}
          />
          <SummaryCard
            label="Projects logged"
            value={String(totals.projectHours.length)}
          />
        </div>
      ) : null}

      {milestones.length > 0 ? (
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Competency milestones</CardTitle>
            <CardDescription>
              Progress toward company-defined experience targets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{milestone.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {milestone.completedHours.toFixed(1)} /{" "}
                      {milestone.targetHours.toFixed(1)} hrs
                      {milestone.categoryName
                        ? ` · ${milestone.categoryName}`
                        : ""}
                    </p>
                  </div>
                  <Badge variant="outline">{milestone.percentComplete}%</Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${milestone.percentComplete}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {totals && totals.categoryHours.length > 0 ? (
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Experience by competency category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {totals.categoryHours.map((item) => (
                <li
                  key={item.categoryId}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.categoryName}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {item.hours.toFixed(1)} hrs
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Entries</CardTitle>
              <CardDescription>
                Project, employer, equipment, lift type, task, and date range.
              </CardDescription>
            </div>
            {canManage ? (
              <Button asChild size="sm">
                <Link href="/experience-log/new">
                  <Plus className="size-4" />
                  Log experience
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateFilters({
                q: String(form.get("q") || "") || undefined,
                from: String(form.get("from") || "") || undefined,
                to: String(form.get("to") || "") || undefined,
              });
            }}
          >
            <Input
              name="q"
              placeholder="Search…"
              defaultValue={filters.q ?? ""}
              className="xl:col-span-2"
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
              value={filters.projectId ?? "__all__"}
              onValueChange={(value) =>
                updateFilters({
                  projectId: value === "__all__" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All projects</SelectItem>
                {projects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.liftType ?? "__all__"}
              onValueChange={(value) =>
                updateFilters({
                  liftType: value === "__all__" ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Lift type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All lift types</SelectItem>
                {Object.entries(LIFT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 xl:col-span-2">
              <Input
                name="from"
                type="date"
                defaultValue={filters.from ?? ""}
                aria-label="From date"
              />
              <Input
                name="to"
                type="date"
                defaultValue={filters.to ?? ""}
                aria-label="To date"
              />
              <Button type="submit" variant="secondary">
                Apply
              </Button>
            </div>
          </form>

          {items.length === 0 ? (
            <EmptyState
              icon={Clock3}
              title="No experience logged"
              description="Record project hours, equipment time, and lift tasks to track apprenticeship progress."
            />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/experience-log/${item.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {item.employee.name} · {item.project.code}{" "}
                        {item.project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          item.employerName,
                          item.taskPerformed,
                          `${formatDate(item.startDate)} – ${formatDate(item.endDate)}`,
                          item.equipment
                            ? `${item.equipment.assetTag} ${item.equipment.name}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {item.hours.toFixed(1)} hrs
                      </Badge>
                      <Badge variant="outline">
                        {LIFT_TYPE_LABELS[
                          item.liftType as keyof typeof LIFT_TYPE_LABELS
                        ] ?? item.liftType}
                      </Badge>
                      {item.isApprenticeship ? (
                        <Badge>Apprenticeship</Badge>
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
                      `/experience-log?${new URLSearchParams({
                        ...Object.fromEntries(
                          Object.entries(filters).filter(
                            ([, value]) => Boolean(value),
                          ),
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
                      `/experience-log?${new URLSearchParams({
                        ...Object.fromEntries(
                          Object.entries(filters).filter(
                            ([, value]) => Boolean(value),
                          ),
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
