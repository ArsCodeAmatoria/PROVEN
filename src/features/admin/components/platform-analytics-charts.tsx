"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
import type { PlatformAnalyticsData } from "@/services/admin.service";

interface PlatformAnalyticsChartsProps {
  data: PlatformAnalyticsData;
}

export function PlatformAnalyticsCharts({
  data,
}: PlatformAnalyticsChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Assessments by status"
        description="Platform-wide assessment volume"
        data={data.assessmentsByStatus}
      />
      <ChartCard
        title="Workers by role"
        description="Employee role distribution across tenants"
        data={data.workersByRole}
      />
      <ChartCard
        title="Companies active vs inactive"
        description="Tenant activation status"
        data={data.companiesActiveVsInactive}
      />
      <ChartCard
        title="Observations by type"
        description="Observation volume by classification"
        data={data.observationsByType}
      />
    </div>
  );
}

function ChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: { name: string; value: number }[];
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
