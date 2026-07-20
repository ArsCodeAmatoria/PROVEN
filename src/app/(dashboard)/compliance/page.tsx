import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import {
  ComplianceDashboardView,
  ComplianceSubnav,
} from "@/features/compliance/components/compliance-dashboard";
import { requireCompanyId, requirePermission } from "@/lib/auth/session";
import { getComplianceDashboard } from "@/services/compliance.service";
import { getAuditReadinessBreakdown } from "@/services/cor-workflow.service";

export const metadata: Metadata = {
  title: "Compliance",
};

export default async function CompliancePage() {
  await requirePermission("compliance");
  const { companyId } = await requireCompanyId();
  const [result, readiness] = await Promise.all([
    getComplianceDashboard(companyId),
    getAuditReadinessBreakdown(companyId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        description="Internal COR audit → findings → corrective actions → management review → external readiness."
      />
      <ComplianceSubnav activeHref="/compliance" />
      {result.error ? (
        <p className="text-sm text-destructive">{result.error}</p>
      ) : result.data ? (
        <ComplianceDashboardView
          data={{
            ...result.data,
            readinessPct: readiness.data?.readinessPct ?? result.data.readinessPct,
            predictedScore:
              readiness.data?.gate
                ? result.data.predictedScore
                : result.data.predictedScore,
          }}
          readiness={readiness.data}
        />
      ) : null}
    </div>
  );
}
