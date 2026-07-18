import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { DemonstrationWizard } from "@/features/demonstrations/components/demonstration-wizard";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { ensureDefaultCompetencyCategories } from "@/services/competencies.service";
import { getDemonstrationEngineOptions } from "@/services/demonstrations.service";
import { fullName } from "@/utils/format";

export const metadata: Metadata = {
  title: "New demonstration",
};

export default async function NewDemonstrationPage() {
  await requirePermission("demonstrations");
  const profile = await requireAuth();

  if (!canWrite(profile.role)) {
    redirect("/demonstrations");
  }

  const { companyId } = await requireCompanyId();
  await ensureDefaultCompetencyCategories(companyId, profile.id);
  const options = await getDemonstrationEngineOptions(companyId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Practical demonstration"
        description="Worker → Project → Category → Competency → Evaluate. Each record is permanent."
      />
      <DemonstrationWizard
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
