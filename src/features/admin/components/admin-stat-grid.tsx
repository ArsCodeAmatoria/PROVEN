import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlatformDashboardStats } from "@/services/admin.service";
import { formatRelative } from "@/utils/format";

interface AdminStatGridProps {
  stats: PlatformDashboardStats;
}

export function AdminStatGrid({ stats }: AdminStatGridProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Companies" value={stats.companies} />
        <StatCard label="Active workers" value={stats.activeWorkers} />
        <StatCard label="Active users" value={stats.activeUsers} />
        <StatCard label="Assessors / instructors" value={stats.assessors} />
        <StatCard
          label="Apprentices / students"
          value={stats.apprenticesStudents}
        />
        <StatCard
          label="Assessments completed"
          value={stats.assessmentsCompleted}
          description={`${stats.assessmentsOutstanding} outstanding`}
        />
        <StatCard label="Competencies" value={stats.competencies} />
        <StatCard
          label="Certificates expiring (30d)"
          value={stats.certificatesExpiringSoon}
        />
        <StatCard
          label="Hired this month"
          value={stats.workersHiredThisMonth}
        />
        <StatCard
          label="Lesson progress"
          value={stats.lessonProgressCompleted}
          description={`${stats.lessonProgressInProgress} in progress · ${stats.lessonProgressNotStarted} not started`}
        />
        <StatCard
          label="Database"
          value={stats.systemHealth.database ? "Healthy" : "Down"}
          description={
            stats.systemHealth.supabase
              ? "Supabase configured"
              : "Supabase not configured"
          }
        />
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Recent audit activity</CardTitle>
          <CardDescription>Latest platform mutations and events</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentAuditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit events yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recentAuditLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{log.action}</Badge>
                      <span className="text-sm font-medium">{log.entityType}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {log.summary ?? "—"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatRelative(log.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminDashboardHeader() {
  return (
    <PageHeader
      title="Platform dashboard"
      description="Cross-tenant overview of companies, workers, learning progress, and system health."
    />
  );
}
