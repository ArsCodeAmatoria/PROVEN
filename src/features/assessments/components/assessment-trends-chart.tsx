"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
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
import {
  ASSESSMENT_RATING_LABELS,
  ASSESSMENT_RATING_SCORES,
} from "@/features/assessments/constants";
import type { CompetencyTrendPoint } from "@/services/assessments.service";
import { formatDate } from "@/utils/format";

interface AssessmentTrendsChartProps {
  trends: CompetencyTrendPoint[];
  competencyTitle?: string | null;
}

const TICKS = [0, 1, 2, 3, 4];

function scoreLabel(value: number) {
  const entry = Object.entries(ASSESSMENT_RATING_SCORES).find(
    ([, score]) => score === value,
  );
  return entry
    ? ASSESSMENT_RATING_LABELS[
        entry[0] as keyof typeof ASSESSMENT_RATING_LABELS
      ]
    : String(value);
}

export function AssessmentTrendsChart({
  trends,
  competencyTitle,
}: AssessmentTrendsChartProps) {
  if (trends.length === 0) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Competency trends</CardTitle>
          <CardDescription>
            Trends appear after multiple permanent assessments for this
            employee and competency.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const data = trends.map((point) => ({
    ...point,
    label: formatDate(point.assessedAt, "MMM d"),
  }));

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Competency trends</CardTitle>
        <CardDescription>
          {competencyTitle
            ? `Historical ratings for ${competencyTitle}`
            : "Historical competency ratings over time"}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, 4]}
              ticks={TICKS}
              tick={{ fontSize: 11 }}
              width={110}
              tickFormatter={scoreLabel}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
              }}
              formatter={(value) => [
                scoreLabel(Number(value)),
                "Rating",
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
