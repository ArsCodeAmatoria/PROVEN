import type { Metadata } from "next";

import { DashboardOverview } from "@/features/dashboard/overview";
import { requireCompanyId } from "@/lib/auth/session";
import { getDashboardData } from "@/services/dashboard.service";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { profile, companyId } = await requireCompanyId();
  const result = await getDashboardData(companyId, profile.employeeId);

  return (
    <DashboardOverview
      data={result.data}
      error={result.error}
      companyName={profile.company?.name}
    />
  );
}
