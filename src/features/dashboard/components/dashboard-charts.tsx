"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardChartPoint } from "@/services/dashboard.service";

const CHART_COLORS = [
  "oklch(0.45 0.04 255)",
  "oklch(0.55 0.08 200)",
  "oklch(0.62 0.1 155)",
  "oklch(0.7 0.12 75)",
  "oklch(0.55 0.16 25)",
  "oklch(0.5 0.06 300)",
];

interface DashboardChartsProps {
  assessmentsByStatus: DashboardChartPoint[];
  competencyLevels: DashboardChartPoint[];
  observationsByRating: DashboardChartPoint[];
}

export function DashboardCharts({
  assessmentsByStatus,
  competencyLevels,
  observationsByRating,
}: DashboardChartsProps) {
  const hasAssessmentData = assessmentsByStatus.some((item) => item.value > 0);
  const hasLevelData = competencyLevels.some((item) => item.value > 0);
  const hasRatingData = observationsByRating.some((item) => item.value > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="shadow-none lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Assessments by status</CardTitle>
          <CardDescription>Current pipeline distribution</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          {hasAssessmentData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assessmentsByStatus}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {assessmentsByStatus.map((entry, index) => (
                    <Cell
                      key={entry.label}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No assessment data yet" />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Competencies by level</CardTitle>
          <CardDescription>Active standards by skill level</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          {hasLevelData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competencyLevels}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip
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
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No competency data yet" />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Observation types</CardTitle>
          <CardDescription>Field observation outcomes</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          {hasRatingData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={observationsByRating} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={88}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="oklch(0.55 0.08 200)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No observation data yet" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
