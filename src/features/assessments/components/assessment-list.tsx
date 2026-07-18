"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ClipboardCheck, Plus, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
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
  ASSESSMENT_RATING_LABELS,
  ASSESSMENT_STATUS_LABELS,
  ASSESSMENT_TYPE_LABELS,
} from "@/features/assessments/constants";
import type { AssessmentListItem } from "@/services/assessments.service";
import type { PaginatedResult } from "@/types";
import { formatDate, fullName } from "@/utils/format";

interface AssessmentListProps {
  result: PaginatedResult<AssessmentListItem> | null;
  error?: string | null;
  canManage: boolean;
  filters: { q?: string };
}

export function AssessmentList({
  result,
  error,
  canManage,
  filters,
}: AssessmentListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const updateFilters = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    if (!("page" in patch)) params.delete("page");
    startTransition(() => {
      router.push(`/assessments?${params.toString()}`);
    });
  };

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load assessments</CardTitle>
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
              placeholder="Search employee, competency, or title"
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            Search
          </Button>
        </form>

        {canManage ? (
          <Button asChild>
            <Link href="/assessments/new">
              <Plus className="mr-2 h-4 w-4" />
              New assessment
            </Link>
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No assessments recorded"
          description="Start the assessment engine to evaluate an employee on a competency."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((assessment) => {
            const employee = assessment.result?.employee;
            const rating = assessment.result?.rating;
            return (
              <Link
                key={assessment.id}
                href={`/assessments/${assessment.id}`}
                className="block rounded-lg outline-none ring-offset-background transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="shadow-none">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">
                        {assessment.title}
                      </CardTitle>
                      <Badge variant="outline">
                        {ASSESSMENT_STATUS_LABELS[assessment.status]}
                      </Badge>
                      {rating ? (
                        <Badge variant="secondary">
                          {ASSESSMENT_RATING_LABELS[rating]}
                        </Badge>
                      ) : null}
                    </div>
                    <CardDescription>
                      {[
                        employee
                          ? fullName(
                              employee.user.firstName,
                              employee.user.lastName,
                            )
                          : null,
                        assessment.project?.name,
                        assessment.competency?.title,
                        ASSESSMENT_TYPE_LABELS[assessment.type],
                        formatDate(
                          assessment.completedAt ?? assessment.createdAt,
                        ),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </CardDescription>
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
            Page {page} of {pageCount} · {result?.total ?? 0} assessments
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
