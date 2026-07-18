import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ApprenticeshipList } from "@/features/apprenticeships/components/apprenticeship-list";
import { requireCompanyId } from "@/lib/auth/session";
import { listApprenticeships } from "@/services/apprenticeships.service";

export const metadata: Metadata = {
  title: "Apprenticeships",
};

export default async function ApprenticeshipsPage() {
  const { companyId } = await requireCompanyId();
  const result = await listApprenticeships(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Jobsites and work programs used to scope assessments, hours, and training matrices."
      />
      <ApprenticeshipList
        items={result.data?.items ?? []}
        error={result.error}
      />
    </div>
  );
}
