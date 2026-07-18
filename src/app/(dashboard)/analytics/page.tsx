import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsDashboardView } from "@/features/analytics/components/analytics-dashboard-view";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getAnalyticsDashboard } from "@/services/analytics.service";

export const metadata: Metadata = {
  title: "Analytics",
};

export default async function AnalyticsPage() {
  await requirePermission("analytics");
  const { companyId } = await requireCompanyId();
  const result = await getAnalyticsDashboard(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Competency performance, reassessment risk, instructor activity, and downloadable reports."
      />
      {result.data ? (
        <AnalyticsDashboardView data={result.data} />
      ) : (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Unable to load analytics</CardTitle>
            <CardDescription>{result.error}</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
