import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { AssessmentWizard } from "@/features/assessments/components/assessment-wizard";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { ensureDefaultCompetencyCategories } from "@/services/competencies.service";
import { getAssessmentEngineOptions } from "@/services/assessments.service";
import { fullName } from "@/utils/format";

export const metadata: Metadata = {
  title: "New assessment",
};

export default async function NewAssessmentPage() {
  await requirePermission("assessments");
  const profile = await requireAuth();

  if (!canWrite(profile.role)) {
    redirect("/assessments");
  }

  const { companyId } = await requireCompanyId();
  await ensureDefaultCompetencyCategories(companyId, profile.id);
  const options = await getAssessmentEngineOptions(companyId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Assessment engine"
        description="Employee → Project → Category → Competency → Assessment. Each submission is stored permanently."
      />
      <AssessmentWizard
        options={
          options.data ?? {
            employees: [],
            projects: [],
            categories: [],
            competencies: [],
          }
        }
        defaultInstructorName={fullName(profile.firstName, profile.lastName)}
      />
    </div>
  );
}
