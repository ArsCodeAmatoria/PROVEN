import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ApprenticeshipList } from "@/features/apprenticeships/components/apprenticeship-list";
import { DEFAULT_ORGANIZATION_ID } from "@/features/competencies/api";
import { listApprenticeships } from "@/services/apprenticeships.service";

export const metadata: Metadata = {
  title: "Apprenticeships",
};

export default async function ApprenticeshipsPage() {
  const result = await listApprenticeships(DEFAULT_ORGANIZATION_ID);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Apprenticeships"
        description="Monitor apprenticeship programs, mentor assignments, hours, and competency progress."
      />
      <ApprenticeshipList
        items={result.data?.items ?? []}
        error={result.error}
      />
    </div>
  );
}
