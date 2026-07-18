import type { Metadata } from "next";

import { DashboardOverview } from "@/features/dashboard/overview";
import { requireCompanyId } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/services/dashboard.service";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DashboardPage() {
  const { companyId } = await requireCompanyId();
  const result = await getDashboardMetrics(companyId);

  return <DashboardOverview metrics={result.data} error={result.error} />;
}
