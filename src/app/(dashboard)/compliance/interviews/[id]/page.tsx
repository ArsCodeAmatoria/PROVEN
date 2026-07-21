import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ComplianceSubnav } from "@/features/compliance/components/compliance-dashboard";
import { InterviewForm } from "@/features/compliance/components/interview-form";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getInterviewDetail } from "@/services/cor-field.service";

export const metadata: Metadata = {
  title: "Interview Detail",
};

export default async function ComplianceInterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("compliance");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;
  const result = await getInterviewDetail(companyId, id);

  if (result.error || !result.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          result.data.subjectName
            ? `${result.data.type} interview — ${result.data.subjectName}`
            : `${result.data.type} interview`
        }
        description="Tablet-friendly Pass / Fail / N/A capture by COR element."
      />
      <ComplianceSubnav activeHref="/compliance/interviews" />
      <InterviewForm
        interview={result.data}
        canManage={canWrite(profile.role)}
      />
    </div>
  );
}
