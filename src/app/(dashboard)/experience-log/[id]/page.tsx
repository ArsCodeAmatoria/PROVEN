import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExperienceLogDetail } from "@/features/experience-log/components/experience-log-detail";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getExperienceLogById } from "@/services/experience-log.service";

interface ExperienceLogDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ExperienceLogDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Experience ${id.slice(0, 8)}` };
}

export default async function ExperienceLogDetailPage({
  params,
}: ExperienceLogDetailPageProps) {
  await requirePermission("experience-log");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;

  const result = await getExperienceLogById(companyId, id);
  if (!result.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ExperienceLogDetail
        entry={result.data}
        canManage={canWrite(profile.role)}
      />
    </div>
  );
}
