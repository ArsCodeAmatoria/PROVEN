import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { ObservationForm } from "@/features/compliance/components/observation-form";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  getInterviewDashboard,
  listObservations,
} from "@/services/cor-field.service";

export const metadata: Metadata = {
  title: "Worksite Observations",
};

export default async function ComplianceObservationsPage() {
  await requirePermission("compliance");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const [observations, dashboard] = await Promise.all([
    listObservations(companyId),
    getInterviewDashboard(companyId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Worksite Observations"
        description="Capture on-site Pass / Fail / N/A notes by category during the COR audit."
      />
      <ComplianceSubnav activeHref="/compliance/observations" />

      {observations.error ? (
        <p className="text-sm text-destructive">{observations.error}</p>
      ) : (
        <ObservationForm
          observations={observations.data ?? []}
          sessions={dashboard.data?.sessions ?? []}
          canManage={canWrite(profile.role)}
        />
      )}
    </div>
  );
}
