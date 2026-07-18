import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompetencyDetailView } from "@/features/competencies/components/competency-detail";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getCompetencyById } from "@/services/competencies.service";

interface CompetencyPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: CompetencyPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Competency ${id.slice(0, 8)}` };
}

export default async function CompetencyDetailPage({
  params,
  searchParams,
}: CompetencyPageProps) {
  await requirePermission("competencies");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;
  const query = await searchParams;
  const tab = Array.isArray(query.tab) ? query.tab[0] : query.tab;

  const result = await getCompetencyById(companyId, id);
  if (!result.data) {
    notFound();
  }

  return (
    <CompetencyDetailView
      competency={result.data}
      canManage={canWrite(profile.role)}
      defaultTab={tab}
    />
  );
}
