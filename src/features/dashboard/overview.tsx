import Link from "next/link";
import {
  Activity,
  Award,
  BadgeCheck,
  ClipboardCheck,
  Eye,
  FolderKanban,
  FileText,
} from "lucide-react";

import { PageHeader, StatCard } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardCharts } from "@/features/dashboard/components/dashboard-charts";
import {
  EmployeesDue,
  ExpiringCertificates,
  RecentActivity,
  RecentObservations,
  UpcomingEvaluations,
} from "@/features/dashboard/components/dashboard-panels";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import type { DashboardData } from "@/services/dashboard.service";

interface DashboardOverviewProps {
  data: DashboardData | null;
  error?: string | null;
  companyName?: string | null;
}

export function DashboardOverview({
  data,
  error,
  companyName,
}: DashboardOverviewProps) {
  const metrics = data?.metrics ?? {
    activeCompetencies: 0,
    openAssessments: 0,
    activeProjects: 0,
    expiringCertificates: 0,
    recentObservations: 0,
    publishedExams: 0,
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="Dashboard"
        description={
          companyName
            ? `Competency operations for ${companyName}.`
            : "Operational view of competency verification across your company."
        }
      />

      {error ? (
        <Card className="border-warning/40 bg-warning/5 shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Unable to load live data</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Confirm <code className="rounded bg-muted px-1.5 py-0.5 text-xs">DATABASE_URL</code>{" "}
              and apply the schema migrations, then refresh.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          icon={BadgeCheck}
          label="Active competencies"
          value={metrics.activeCompetencies}
          href="/competencies"
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Open assessments"
          value={metrics.openAssessments}
          href="/assessments"
        />
        <MetricCard
          icon={FolderKanban}
          label="Active projects"
          value={metrics.activeProjects}
          href="/apprenticeships"
        />
        <MetricCard
          icon={Award}
          label="Expiring certificates"
          value={metrics.expiringCertificates}
          href="/certifications"
        />
        <MetricCard
          icon={Eye}
          label="Recent observations"
          value={metrics.recentObservations}
          href="/observations"
        />
        <MetricCard
          icon={FileText}
          label="Published exams"
          value={metrics.publishedExams}
          href="/exams"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <DashboardCharts
            assessmentsByStatus={data?.assessmentsByStatus ?? []}
            competencyLevels={data?.competencyLevels ?? []}
            observationsByRating={data?.observationsByRating ?? []}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <UpcomingEvaluations items={data?.upcomingEvaluations ?? []} />
            <EmployeesDue items={data?.employeesDue ?? []} />
            <ExpiringCertificates items={data?.expiringCertificates ?? []} />
            <RecentObservations items={data?.recentObservations ?? []} />
          </div>

          <RecentActivity items={data?.recentActivity ?? []} />
        </div>

        <div className="space-y-4">
          <QuickActions />
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Workspace pulse
              </CardTitle>
              <CardDescription>
                Snapshot of verification workload this period.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <PulseRow
                label="Open evaluations"
                value={metrics.openAssessments}
              />
              <PulseRow
                label="Due assessments"
                value={data?.employeesDue.length ?? 0}
              />
              <PulseRow
                label="Certificates at risk"
                value={metrics.expiringCertificates}
              />
              <PulseRow
                label="Observations (7d)"
                value={metrics.recentObservations}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <StatCard
        label={label}
        value={value}
        description={
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            <span className="group-hover:underline">Open module</span>
          </span>
        }
        className="transition-colors group-hover:border-foreground/20"
      />
    </Link>
  );
}

function PulseRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
