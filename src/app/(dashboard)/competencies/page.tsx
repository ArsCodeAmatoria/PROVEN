import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { CompetencyList } from "@/features/competencies/components/competency-list";
import { getCompetencyModuleData } from "@/features/competencies/api";

export const metadata: Metadata = {
  title: "Competencies",
};

export default async function CompetenciesPage() {
  const result = await getCompetencyModuleData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competencies"
        description="Define and maintain practical competency standards for construction trades."
      />
      <CompetencyList items={result.data?.items ?? []} error={result.error} />
    </div>
  );
}
