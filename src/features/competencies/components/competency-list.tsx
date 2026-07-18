"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { BadgeCheck, Plus, Search } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMPETENCY_DIFFICULTY_LABELS,
  COMPETENCY_STATUS_LABELS,
} from "@/features/competencies/constants";
import type { CompetencyListItem } from "@/services/competencies.service";
import type { PaginatedResult } from "@/types";

interface CompetencyListProps {
  result: PaginatedResult<CompetencyListItem> | null;
  error?: string | null;
  categoryOptions: { id: string; label: string }[];
  canManage: boolean;
  filters: {
    q?: string;
    status?: string;
    difficulty?: string;
    categoryId?: string;
  };
}

export function CompetencyList({
  result,
  error,
  categoryOptions,
  canManage,
  filters,
}: CompetencyListProps) {
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
      router.push(`/competencies?${params.toString()}`);
    });
  };

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load competencies</CardTitle>
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
              placeholder="Search title, code, or reference"
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            Search
          </Button>
        </form>

        {canManage ? (
          <Button asChild>
            <Link href="/competencies/new">
              <Plus className="mr-2 h-4 w-4" />
              Add competency
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => updateFilters({ status: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(COMPETENCY_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.difficulty || "all"}
          onValueChange={(value) => updateFilters({ difficulty: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            {Object.entries(COMPETENCY_DIFFICULTY_LABELS).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId || "all"}
          onValueChange={(value) => updateFilters({ categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="No competencies found"
          description="Create a competency standard or adjust filters to browse the library."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((competency) => (
            <Link
              key={competency.id}
              href={`/competencies/${competency.id}`}
              className="block rounded-lg outline-none ring-offset-background transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="shadow-none">
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{competency.title}</CardTitle>
                    <Badge variant="secondary">{competency.code}</Badge>
                    <Badge variant="outline">
                      {COMPETENCY_STATUS_LABELS[competency.status]}
                    </Badge>
                    <Badge variant="outline">
                      {COMPETENCY_DIFFICULTY_LABELS[competency.difficulty]}
                    </Badge>
                  </div>
                  <CardDescription>
                    {[
                      competency.category?.name,
                      competency.estimatedTimeMinutes
                        ? `${competency.estimatedTimeMinutes} min`
                        : null,
                      competency.requiredScore != null
                        ? `Score ${competency.requiredScore}%`
                        : null,
                      competency.attachmentCount
                        ? `${competency.attachmentCount} attachments`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount} · {result?.total ?? 0} competencies
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
