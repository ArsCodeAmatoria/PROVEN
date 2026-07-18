import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { ObservationList } from "@/features/observations/components/observation-list";
import { requireCompanyId } from "@/lib/auth/session";
import { listObservations } from "@/services/observations.service";

export const metadata: Metadata = {
  title: "Observations",
};

export default async function ObservationsPage() {
  const { companyId } = await requireCompanyId();
  const result = await listObservations(companyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instructor Observations"
        description="Field observations with ratings and notes that support competency verification."
      />
      <ObservationList items={result.data?.items ?? []} error={result.error} />
    </div>
  );
}
