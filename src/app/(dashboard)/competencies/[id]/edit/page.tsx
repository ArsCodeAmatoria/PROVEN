import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { CompetencyAttachments } from "@/features/competencies/components/competency-attachments";
import { CompetencyForm } from "@/features/competencies/components/competency-form";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  getCompetencyById,
  listCompetencyCategoryOptions,
} from "@/services/competencies.service";

interface EditCompetencyPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditCompetencyPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Edit competency ${id.slice(0, 8)}` };
}

export default async function EditCompetencyPage({
  params,
}: EditCompetencyPageProps) {
  await requirePermission("competencies");
  const profile = await requireAuth();

  if (!canWrite(profile.role)) {
    redirect("/competencies");
  }

  const { companyId } = await requireCompanyId();
  const { id } = await params;

  const [competencyResult, categories] = await Promise.all([
    getCompetencyById(companyId, id),
    listCompetencyCategoryOptions(companyId),
  ]);

  if (!competencyResult.data) {
    notFound();
  }

  const competency = competencyResult.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={`Edit ${competency.title}`}
        description="Update standards, references, demonstrations, and status."
      />

      <CompetencyForm
        mode="edit"
        competencyId={competency.id}
        categoryOptions={categories.data ?? []}
        defaultValues={{
          code: competency.code,
          title: competency.title,
          description: competency.description,
          categoryId: competency.categoryId ?? undefined,
          reference: competency.reference ?? "",
          csaReference: competency.csaReference ?? "",
          asmeReference: competency.asmeReference ?? "",
          workSafeBcReference: competency.workSafeBcReference ?? "",
          requiredDemonstrations: competency.requiredDemonstrations ?? "",
          requiredDemonstrationCount:
            competency.requiredDemonstrationCount ?? undefined,
          requiredScore: competency.requiredScore ?? undefined,
          difficulty: competency.difficulty,
          estimatedTimeMinutes: competency.estimatedTimeMinutes ?? undefined,
          trade: competency.trade ?? "",
          level: competency.level,
          status: competency.status,
        }}
      />

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Attachments</h3>
        <CompetencyAttachments
          competencyId={competency.id}
          attachments={competency.attachments}
          canManage
        />
      </div>
    </div>
  );
}
