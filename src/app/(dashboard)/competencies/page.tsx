import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { CompetencyLibrary } from "@/features/competencies/components/competency-library";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  listCompetencies,
  listCompetencyCategories,
  listCompetencyCategoryOptions,
} from "@/services/competencies.service";

export const metadata: Metadata = {
  title: "Competency Library",
};

interface CompetenciesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompetenciesPage({
  searchParams,
}: CompetenciesPageProps) {
  await requirePermission("competencies");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;

  const q = first(params.q)?.trim() || undefined;
  const status = first(params.status) || undefined;
  const difficulty = first(params.difficulty) || undefined;
  const categoryId = first(params.categoryId) || undefined;
  const page = Number(first(params.page) || "1");

  const [competencies, categories, categoryOptions] = await Promise.all([
    listCompetencies(companyId, {
      q,
      status,
      difficulty,
      categoryId,
      page: Number.isFinite(page) ? page : 1,
      pageSize: 20,
    }),
    listCompetencyCategories(companyId, profile.id),
    listCompetencyCategoryOptions(companyId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competency Library"
        description="Construction competency standards with nested categories, references, demonstrations, and attachments."
      />
      <Suspense fallback={null}>
        <CompetencyLibrary
          result={competencies.data}
          error={competencies.error}
          categories={categories.data ?? []}
          categoryOptions={categoryOptions.data ?? []}
          canManage={canWrite(profile.role)}
          filters={{ q, status, difficulty, categoryId }}
        />
      </Suspense>
    </div>
  );
}
