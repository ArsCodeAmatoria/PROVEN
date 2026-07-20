import type { Metadata } from "next";

import { PageHeader, StatCard } from "@/components/shared/page-header";
import { PlatformAnalyticsCharts } from "@/features/admin/components/platform-analytics-charts";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformAnalyticsData } from "@/services/admin.service";

export const metadata: Metadata = {
  title: "Analytics · Platform Admin",
};

export default async function AdminAnalyticsPage() {
  const result = await getPlatformAnalyticsData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Cross-tenant distributions for assessments, roles, and observations."
      />
      {result.error || !result.data ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Unable to load analytics</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Companies"
              value={result.data.totals.companies}
            />
            <StatCard label="Workers" value={result.data.totals.workers} />
            <StatCard
              label="Assessments"
              value={result.data.totals.assessments}
            />
            <StatCard
              label="Observations"
              value={result.data.totals.observations}
            />
          </div>
          <PlatformAnalyticsCharts data={result.data} />
        </>
      )}
    </div>
  );
}
