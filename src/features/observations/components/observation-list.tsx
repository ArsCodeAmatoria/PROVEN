"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Eye, Plus, Search } from "lucide-react";

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
  OBSERVATION_FOLLOW_UP_LABELS,
  OBSERVATION_TYPE_LABELS,
} from "@/features/observations/constants";
import type { ObservationListItem } from "@/services/observations.service";
import type { PaginatedResult } from "@/types";
import { formatDate, fullName } from "@/utils/format";

interface ObservationListProps {
  result: PaginatedResult<ObservationListItem> | null;
  error?: string | null;
  canManage: boolean;
  filters: {
    q?: string;
    observationType?: string;
    followUpStatus?: string;
  };
}

export function ObservationList({
  result,
  error,
  canManage,
  filters,
}: ObservationListProps) {
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
      router.push(`/observations?${params.toString()}`);
    });
  };

  if (error) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Unable to load observations</CardTitle>
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
              placeholder="Search worker, location, or summary"
              className="pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            Search
          </Button>
        </form>

        {canManage ? (
          <Button asChild>
            <Link href="/observations/new">
              <Plus className="mr-2 h-4 w-4" />
              Record observation
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Select
          value={filters.observationType || "all"}
          onValueChange={(value) => updateFilters({ observationType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(OBSERVATION_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.followUpStatus || "all"}
          onValueChange={(value) => updateFilters({ followUpStatus: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Follow-up" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All follow-up statuses</SelectItem>
            {Object.entries(OBSERVATION_FOLLOW_UP_LABELS).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="No field observations"
          description="Record observations during normal work to build permanent competency history."
        />
      ) : (
        <div className="grid gap-3">
          {items.map((observation) => (
            <Link
              key={observation.id}
              href={`/observations/${observation.id}`}
              className="block rounded-lg outline-none ring-offset-background transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card className="shadow-none">
                <CardHeader className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">
                      {observation.context}
                    </CardTitle>
                    <Badge variant="secondary">
                      {OBSERVATION_TYPE_LABELS[observation.observationType]}
                    </Badge>
                    <Badge variant="outline">
                      {
                        OBSERVATION_FOLLOW_UP_LABELS[
                          observation.followUpStatus
                        ]
                      }
                    </Badge>
                  </div>
                  <CardDescription>
                    {[
                      fullName(
                        observation.employee.user.firstName,
                        observation.employee.user.lastName,
                      ),
                      observation.project?.name,
                      observation.location,
                      formatDate(observation.observedAt, "MMM d, yyyy p"),
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
            Page {page} of {pageCount} · {result?.total ?? 0} observations
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
