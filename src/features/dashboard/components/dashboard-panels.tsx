import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  DashboardActivityItem,
  DashboardCertificateItem,
  DashboardEmployeeDue,
  DashboardEvaluationItem,
  DashboardObservationItem,
} from "@/services/dashboard.service";
import { formatDate, formatRelative } from "@/utils/format";

function Panel({
  title,
  description,
  href,
  children,
  empty,
}: {
  title: string;
  description: string;
  href: string;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href={href}>
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-8 text-center text-sm text-muted-foreground">
            Nothing to show yet.
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function UpcomingEvaluations({
  items,
}: {
  items: DashboardEvaluationItem[];
}) {
  return (
    <Panel
      title="Upcoming evaluations"
      description="Scheduled and in-progress assessments"
      href="/assessments"
      empty={items.length === 0}
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.type}
                {item.scheduledAt
                  ? ` · ${formatDate(item.scheduledAt, "MMM d, yyyy · h:mm a")}`
                  : ""}
              </p>
            </div>
            <Badge variant="outline">{item.status}</Badge>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function RecentActivity({ items }: { items: DashboardActivityItem[] }) {
  return (
    <Panel
      title="Recent activity"
      description="Audit trail across the company"
      href="/settings"
      empty={items.length === 0}
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary">{item.action}</Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatRelative(item.createdAt)}
              </span>
            </div>
            <p className="mt-1.5 text-sm">
              {item.summary ?? `${item.action} on ${item.entityType}`}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function EmployeesDue({ items }: { items: DashboardEmployeeDue[] }) {
  return (
    <Panel
      title="Employees due for assessment"
      description="Training matrix items due or overdue"
      href="/people"
      empty={items.length === 0}
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={`${item.employeeId}-${item.competencyTitle}`}
            className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.competencyTitle}
                {item.title ? ` · ${item.title}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant="outline">{item.status}</Badge>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {item.dueDate ? formatDate(item.dueDate) : "No due date"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function ExpiringCertificates({
  items,
}: {
  items: DashboardCertificateItem[];
}) {
  return (
    <Panel
      title="Expiring certificates"
      description="Credentials expiring within 30 days"
      href="/certifications"
      empty={items.length === 0}
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.employeeName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant="warning">{item.status}</Badge>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {item.expiresAt ? formatDate(item.expiresAt) : "—"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function RecentObservations({
  items,
}: {
  items: DashboardObservationItem[];
}) {
  return (
    <Panel
      title="Recent observations"
      description="Latest instructor field notes"
      href="/observations"
      empty={items.length === 0}
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium">{item.context}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.employeeName} · {formatRelative(item.observedAt)}
              </p>
            </div>
            <Badge variant="secondary">{item.rating}</Badge>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
