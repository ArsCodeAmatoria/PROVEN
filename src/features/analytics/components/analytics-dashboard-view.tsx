"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsDashboardData } from "@/services/analytics.service";
import { formatDate, formatRelative } from "@/utils/format";

interface AnalyticsDashboardViewProps {
  data: AnalyticsDashboardData;
}

export function AnalyticsDashboardView({ data }: AnalyticsDashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <MetricPill
            label="Company competency"
            value={`${data.companyCompetencyPercent}%`}
          />
          <MetricPill
            label="Need reassessment"
            value={String(data.workersRequiringReassessment.length)}
          />
          <MetricPill
            label="Upcoming reassessments"
            value={String(data.upcomingReassessments.length)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/analytics/export?format=xlsx">
              <FileSpreadsheet className="size-4" />
              Excel
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/api/analytics/export?format=pdf">
              <FileText className="size-4" />
              PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Most assessed competencies"
          description="Highest assessment volume"
          data={data.mostAssessedCompetencies}
          valueLabel="Assessments"
        />
        <ChartCard
          title="Lowest pass rates"
          description="Competencies needing attention"
          data={data.lowestPassRateCompetencies}
          valueLabel="Pass %"
        />
        <ChartCard
          title="Average score by trade"
          description="Rating score average (0–4)"
          data={data.averageScoreByTrade}
          valueLabel="Avg score"
        />
        <ChartCard
          title="Instructor activity"
          description="Assessments, observations, and demos"
          data={data.instructorActivity}
          valueLabel="Activity"
        />
        <ChartCard
          title="Project competency completion"
          description="Percent complete by project"
          data={data.projectCompletion}
          valueLabel="% complete"
        />
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Company competency %</CardTitle>
            <CardDescription>
              Share of matrix cells marked competent or verified
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-56 items-center justify-center">
            <div className="text-center">
              <p className="text-5xl font-semibold tabular-nums tracking-tight">
                {data.companyCompetencyPercent}%
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Overall competency completion
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard
          title="Workers requiring reassessment"
          description="Expired validity or matrix reassessment status"
        >
          {data.workersRequiringReassessment.length === 0 ? (
            <EmptyList label="No workers currently need reassessment" />
          ) : (
            <ul className="space-y-3">
              {data.workersRequiringReassessment.map((item) => (
                <li
                  key={item.employeeId}
                  className="flex items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/people/${item.employeeId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[item.trade, item.reason].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge variant="warning">
                    {item.competencyCount} competencies
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </ListCard>

        <ListCard
          title="Upcoming reassessments"
          description="Due within the next 60 days"
        >
          {data.upcomingReassessments.length === 0 ? (
            <EmptyList label="No upcoming reassessments scheduled" />
          ) : (
            <ul className="space-y-3">
              {data.upcomingReassessments.map((item) => (
                <li
                  key={`${item.source}-${item.id}`}
                  className="flex items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.workerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.competencyTitle}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{item.source}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(item.dueAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ListCard>

        <ListCard
          title="Recent observations"
          description="Latest field observation activity"
        >
          {data.recentObservations.length === 0 ? (
            <EmptyList label="No recent observations" />
          ) : (
            <ul className="space-y-3">
              {data.recentObservations.map((item) => (
                <li key={item.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <Link
                    href={item.href}
                    className="text-sm font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {item.subtitle} · {formatRelative(item.occurredAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ListCard>

        <ListCard
          title="Recent demonstrations"
          description="Latest practical demonstration records"
        >
          {data.recentDemonstrations.length === 0 ? (
            <EmptyList label="No recent demonstrations" />
          ) : (
            <ul className="space-y-3">
              {data.recentDemonstrations.map((item) => (
                <li key={item.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <Link
                    href={item.href}
                    className="text-sm font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {item.subtitle} · {formatRelative(item.occurredAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ListCard>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Download className="size-3.5" />
        Downloads include charts data tables, reassessment lists, instructor
        activity, and project completion.
      </p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  data,
  valueLabel,
}: {
  title: string;
  description: string;
  data: { label: string; value: number }[];
  valueLabel: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-56">
        {data.length === 0 ? (
          <EmptyList label="No data yet" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="label"
                width={72}
                tick={{ fontSize: 10 }}
              />
              <Tooltip
                formatter={(value) => [String(value ?? ""), valueLabel]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="value"
                fill="oklch(0.45 0.04 255)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function ListCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyList({ label }: { label: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  );
}
