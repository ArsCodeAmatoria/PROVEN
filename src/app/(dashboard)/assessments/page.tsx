import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { AssessmentList } from "@/features/assessments/components/assessment-list";
import { requireCompanyId } from "@/lib/auth/session";
import { listContinuousAssessments } from "@/services/assessments.service";

export const metadata: Metadata = {
  title: "Assessments",
};

export default async function AssessmentsPage() {
  const { companyId } = await requireCompanyId();
  const result = await listContinuousAssessments(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Continuous Assessments"
        description="Practical, written, observation, portfolio, and oral assessments tied to verified competencies."
      />
      <AssessmentList items={result.data?.items ?? []} error={result.error} />
    </div>
  );
}
