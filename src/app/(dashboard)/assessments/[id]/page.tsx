import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssessmentDetailView } from "@/features/assessments/components/assessment-detail";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getAssessmentById } from "@/services/assessments.service";

interface AssessmentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AssessmentPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Assessment ${id.slice(0, 8)}` };
}

export default async function AssessmentDetailPage({
  params,
}: AssessmentPageProps) {
  await requirePermission("assessments");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;

  const result = await getAssessmentById(companyId, id);
  if (!result.data) {
    notFound();
  }

  return (
    <AssessmentDetailView
      assessment={result.data}
      canManage={canWrite(profile.role)}
    />
  );
}
