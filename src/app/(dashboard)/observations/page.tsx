import type { Metadata } from "next";

import { PageHeader } from "@/components/shared/page-header";
import { DEFAULT_ORGANIZATION_ID } from "@/features/competencies/api";
import { ObservationList } from "@/features/observations/components/observation-list";
import { listObservations } from "@/services/observations.service";

export const metadata: Metadata = {
  title: "Observations",
};

export default async function ObservationsPage() {
  const result = await listObservations(DEFAULT_ORGANIZATION_ID);

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
