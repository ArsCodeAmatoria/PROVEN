import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { CompetencyForm } from "@/features/competencies/components/competency-form";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { listCompetencyCategoryOptions } from "@/services/competencies.service";

export const metadata: Metadata = {
  title: "Add competency",
};

export default async function NewCompetencyPage() {
  await requirePermission("competencies");
  const profile = await requireAuth();

  if (!canWrite(profile.role)) {
    redirect("/competencies");
  }

  const { companyId } = await requireCompanyId();
  const categories = await listCompetencyCategoryOptions(companyId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add competency"
        description="Define a practical competency standard for the library."
      />
      <CompetencyForm
        mode="create"
        categoryOptions={categories.data ?? []}
      />
    </div>
  );
}
