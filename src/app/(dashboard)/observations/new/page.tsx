import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ObservationForm } from "@/features/observations/components/observation-form";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { ensureDefaultCompetencyCategories } from "@/services/competencies.service";
import { getObservationEngineOptions } from "@/services/observations.service";

export const metadata: Metadata = {
  title: "Record observation",
};

export default async function NewObservationPage() {
  await requirePermission("observations");
  const profile = await requireAuth();

  if (!canWrite(profile.role)) {
    redirect("/observations");
  }

  const { companyId } = await requireCompanyId();
  await ensureDefaultCompetencyCategories(companyId, profile.id);
  const options = await getObservationEngineOptions(companyId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Record field observation"
        description="Capture worker, project, timing, location, competency context, and follow-up during normal work."
      />
      <ObservationForm
        options={
          options.data ?? {
            employees: [],
            projects: [],
            categories: [],
            competencies: [],
          }
        }
      />
    </div>
  );
}
