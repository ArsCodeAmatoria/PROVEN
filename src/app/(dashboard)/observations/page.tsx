import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { ObservationList } from "@/features/observations/components/observation-list";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import type { ObservationFollowUpStatus, ObservationType } from "@/types";
import { listObservations } from "@/services/observations.service";

export const metadata: Metadata = {
  title: "Field Observations",
};

interface ObservationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ObservationsPage({
  searchParams,
}: ObservationsPageProps) {
  await requirePermission("observations");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;

  const q = first(params.q)?.trim() || undefined;
  const observationType = first(params.observationType) as
    | ObservationType
    | undefined;
  const followUpStatus = first(params.followUpStatus) as
    | ObservationFollowUpStatus
    | undefined;
  const page = Number(first(params.page) || "1");

  const result = await listObservations(companyId, {
    q,
    observationType,
    followUpStatus,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Observations"
        description="Record observations during normal work. Every entry becomes permanent competency history for the worker."
      />
      <Suspense fallback={null}>
        <ObservationList
          result={result.data}
          error={result.error}
          canManage={canWrite(profile.role)}
          filters={{
            q,
            observationType,
            followUpStatus,
          }}
        />
      </Suspense>
    </div>
  );
}
