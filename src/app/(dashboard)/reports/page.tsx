import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ReportsHub } from "@/features/reports/components/reports-hub";
import {
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getReportOptions } from "@/services/reports.service";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  await requirePermission("reports");
  const { companyId } = await requireCompanyId();
  const options = await getReportOptions(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate professional PDF reports with branding, photos, history, trends, and signatures."
      />
      <ReportsHub options={options.data} error={options.error} />
    </div>
  );
}
