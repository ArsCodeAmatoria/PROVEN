import type { Metadata } from "next";

import { DashboardOverview } from "@/features/dashboard/overview";
import { DEFAULT_ORGANIZATION_ID } from "@/features/competencies/api";
import { getDashboardMetrics } from "@/services/dashboard.service";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function DashboardPage() {
  const result = await getDashboardMetrics(DEFAULT_ORGANIZATION_ID);

  return (
    <DashboardOverview metrics={result.data} error={result.error} />
  );
}
