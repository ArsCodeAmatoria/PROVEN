import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ExperienceLogForm } from "@/features/experience-log/components/experience-log-form";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { ensureDefaultCompetencyCategories } from "@/services/competencies.service";
import { getExperienceEngineOptions } from "@/services/experience-log.service";

export const metadata: Metadata = {
  title: "Log experience",
};

export default async function NewExperienceLogPage() {
  await requirePermission("experience-log");
  const profile = await requireAuth();

  if (!canWrite(profile.role)) {
    redirect("/experience-log");
  }

  const { companyId } = await requireCompanyId();
  await ensureDefaultCompetencyCategories(companyId, profile.id);
  const options = await getExperienceEngineOptions(companyId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Log experience"
        description="Record project hours, equipment time, lift type, tasks, supervisor, and date range."
      />
      <ExperienceLogForm
        options={
          options.data ?? {
            companyName: "",
            employees: [],
            projects: [],
            equipment: [],
            categories: [],
            competencies: [],
            supervisors: [],
          }
        }
      />
    </div>
  );
}
