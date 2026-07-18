"use client";

import { Download, FileSpreadsheet, FileText, Grid3x3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TRAINING_MATRIX_STATUSES,
  TRAINING_MATRIX_STATUS_LABELS,
  TRAINING_MATRIX_STATUS_STYLES,
} from "@/features/training-matrix/constants";
import { switchCompanyAction } from "@/lib/auth/actions";
import type { TrainingMatrixDisplayStatus } from "@/lib/validations/training-matrix";
import { cn } from "@/lib/utils";
import type {
  TrainingMatrixData,
  TrainingMatrixFilterOptions,
} from "@/services/training-matrix.service";
import { formatDate } from "@/utils/format";

interface TrainingMatrixViewProps {
  data: TrainingMatrixData | null;
  error: string | null;
  options: TrainingMatrixFilterOptions | null;
  currentCompanyId: string;
  filters: {
    projectId?: string;
    trade?: string;
    crew?: string;
    supervisorId?: string;
    status?: TrainingMatrixDisplayStatus;
  };
}

const ALL = "__all__";

export function TrainingMatrixView({
  data,
  error,
  options,
  currentCompanyId,
  filters,
}: TrainingMatrixViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const cellLookup = useMemo(() => {
    const map = new Map<string, TrainingMatrixData["cells"][number]>();
    if (!data) return map;
    for (const cell of data.cells) {
      map.set(`${cell.employeeId}:${cell.competencyId}`, cell);
    }
    return map;
  }, [data]);

  function updateFilters(next: Partial<typeof filters> & { companyId?: string }) {
    startTransition(() => {
      void (async () => {
        if (next.companyId && next.companyId !== currentCompanyId) {
          await switchCompanyAction(next.companyId);
        }

        const params = new URLSearchParams();
        const merged = { ...filters, ...next };
        if (merged.projectId) params.set("projectId", merged.projectId);
        if (merged.trade) params.set("trade", merged.trade);
        if (merged.crew) params.set("crew", merged.crew);
        if (merged.supervisorId) params.set("supervisorId", merged.supervisorId);
        if (merged.status) params.set("status", merged.status);
        const query = params.toString();
        router.push(query ? `/training-matrix?${query}` : "/training-matrix");
      })();
    });
  }

  function exportUrl(format: "xlsx" | "pdf") {
    const params = new URLSearchParams({ format });
    if (filters.projectId) params.set("projectId", filters.projectId);
    if (filters.trade) params.set("trade", filters.trade);
    if (filters.crew) params.set("crew", filters.crew);
    if (filters.supervisorId) params.set("supervisorId", filters.supervisorId);
    if (filters.status) params.set("status", filters.status);
    return `/api/training-matrix/export?${params.toString()}`;
  }

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load training matrix</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription>
                Scope workers and competencies by company, project, trade, crew,
                or supervisor.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={exportUrl("xlsx")}>
                  <FileSpreadsheet className="size-4" />
                  Excel
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={exportUrl("pdf")}>
                  <FileText className="size-4" />
                  PDF
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterSelect
            label="Company"
            value={currentCompanyId}
            disabled={pending || (options?.companies.length ?? 0) <= 1}
            onChange={(value) => updateFilters({ companyId: value })}
            items={(options?.companies ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            hideAll
          />
          <FilterSelect
            label="Project"
            value={filters.projectId}
            disabled={pending}
            onChange={(value) =>
              updateFilters({ projectId: value === ALL ? undefined : value })
            }
            items={(options?.projects ?? []).map((item) => ({
              value: item.id,
              label: `${item.code} · ${item.name}`,
            }))}
          />
          <FilterSelect
            label="Trade"
            value={filters.trade}
            disabled={pending}
            onChange={(value) =>
              updateFilters({ trade: value === ALL ? undefined : value })
            }
            items={(options?.trades ?? []).map((item) => ({
              value: item,
              label: item,
            }))}
          />
          <FilterSelect
            label="Crew"
            value={filters.crew}
            disabled={pending}
            onChange={(value) =>
              updateFilters({ crew: value === ALL ? undefined : value })
            }
            items={(options?.crews ?? []).map((item) => ({
              value: item,
              label: item,
            }))}
          />
          <FilterSelect
            label="Supervisor"
            value={filters.supervisorId}
            disabled={pending}
            onChange={(value) =>
              updateFilters({
                supervisorId: value === ALL ? undefined : value,
              })
            }
            items={(options?.supervisors ?? []).map((item) => ({
              value: item.id,
              label: item.label,
            }))}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            disabled={pending}
            onChange={(value) =>
              updateFilters({
                status:
                  value === ALL
                    ? undefined
                    : (value as TrainingMatrixDisplayStatus),
              })
            }
            items={TRAINING_MATRIX_STATUSES.map((status) => ({
              value: status,
              label: TRAINING_MATRIX_STATUS_LABELS[status],
            }))}
          />
        </CardContent>
      </Card>

      {data ? (
        <div className="flex flex-wrap gap-2">
          {TRAINING_MATRIX_STATUSES.map((status) => (
            <div
              key={status}
              className={cn(
                "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium",
                TRAINING_MATRIX_STATUS_STYLES[status],
              )}
            >
              <span>{TRAINING_MATRIX_STATUS_LABELS[status]}</span>
              <span className="tabular-nums opacity-80">
                {data.summary[status]}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {!data || data.workers.length === 0 || data.competencies.length === 0 ? (
        <EmptyState
          icon={Grid3x3}
          title="No matrix data"
          description="Add active workers and competencies, or widen your filters."
        />
      ) : (
        <Card className="shadow-none overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {data.companyName} competency matrix
            </CardTitle>
            <CardDescription>
              Rows are workers · columns are competencies ·{" "}
              {data.workers.length} × {data.competencies.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[70vh]">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-30 bg-background border-b border-r px-3 py-2 text-left font-semibold min-w-44">
                      Worker
                    </th>
                    {data.competencies.map((competency) => (
                      <th
                        key={competency.id}
                        className="sticky top-0 z-20 bg-background border-b px-2 py-2 text-left font-medium min-w-28 max-w-36 align-bottom"
                        title={competency.title}
                      >
                        <div className="line-clamp-2 leading-tight">
                          <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                            {competency.code}
                          </span>
                          {competency.title}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.workers.map((worker) => (
                    <tr key={worker.id} className="border-b last:border-0">
                      <th className="sticky left-0 z-10 bg-background border-r px-3 py-2 text-left font-medium whitespace-nowrap">
                        <div>{worker.name}</div>
                        <div className="text-[10px] font-normal text-muted-foreground">
                          {[worker.trade, worker.crew]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </div>
                      </th>
                      {data.competencies.map((competency) => {
                        const cell = cellLookup.get(
                          `${worker.id}:${competency.id}`,
                        );
                        const status = cell?.status ?? "NOT_STARTED";
                        return (
                          <td key={competency.id} className="px-1.5 py-1.5">
                            <div
                              className={cn(
                                "rounded border px-1.5 py-1.5 text-center font-medium leading-tight",
                                TRAINING_MATRIX_STATUS_STYLES[status],
                              )}
                              title={
                                cell?.lastAssessedAt
                                  ? `${TRAINING_MATRIX_STATUS_LABELS[status]} · ${formatDate(cell.lastAssessedAt)}`
                                  : TRAINING_MATRIX_STATUS_LABELS[status]
                              }
                            >
                              {TRAINING_MATRIX_STATUS_LABELS[status]}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Download className="size-3.5" />
        Exports use the current filters and include color-coded competency
        status.
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  items,
  onChange,
  disabled,
  hideAll = false,
}: {
  label: string;
  value?: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  hideAll?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select
        value={value ?? ALL}
        onValueChange={onChange}
        disabled={disabled || (hideAll && items.length === 0)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {hideAll ? null : (
            <SelectItem value={ALL}>All</SelectItem>
          )}
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
