import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { SiteSamplingPanel } from "@/features/compliance/components/site-sampling-panel";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  getOrCreateSamplingPlan,
  listSamplingPlan,
} from "@/services/cor-field.service";

export const metadata: Metadata = {
  title: "Site Sampling",
};

export default async function SiteSamplingPage() {
  await requirePermission("compliance");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();

  let planResult = await listSamplingPlan(companyId);
  if (!planResult.error && !planResult.data) {
    planResult = await getOrCreateSamplingPlan(companyId, {
      createdById: profile.id,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Site Sampling"
        description="Build the COR audit site list, then recommend a diversified sample by risk, project type, supervisor, and crew size."
      />
      <ComplianceSubnav activeHref="/compliance/site-sampling" />

      {planResult.error ? (
        <p className="text-sm text-destructive">{planResult.error}</p>
      ) : (
        <SiteSamplingPanel
          plan={planResult.data}
          canManage={canWrite(profile.role)}
        />
      )}
    </div>
  );
}
