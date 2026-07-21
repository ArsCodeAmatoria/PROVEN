import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { InterviewDashboard } from "@/features/compliance/components/interview-dashboard";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getInterviewDashboard } from "@/services/cor-field.service";

export const metadata: Metadata = {
  title: "COR Interviews",
};

export default async function ComplianceInterviewsPage() {
  await requirePermission("compliance");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const result = await getInterviewDashboard(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        description="Worker and manager interviews seeded from COR questions that require interview verification."
      />
      <ComplianceSubnav activeHref="/compliance/interviews" />

      {result.error || !result.data ? (
        <p className="text-sm text-destructive">
          {result.error ?? "Unable to load interviews."}
        </p>
      ) : (
        <InterviewDashboard
          data={result.data}
          canManage={canWrite(profile.role)}
        />
      )}
    </div>
  );
}
