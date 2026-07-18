import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { DemonstrationList } from "@/features/demonstrations/components/demonstration-list";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import type { AssessmentRating } from "@/types";
import { listDemonstrations } from "@/services/demonstrations.service";

export const metadata: Metadata = {
  title: "Practical Demonstrations",
};

interface DemonstrationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function DemonstrationsPage({
  searchParams,
}: DemonstrationsPageProps) {
  await requirePermission("demonstrations");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;
  const q = first(params.q)?.trim() || undefined;
  const rating = first(params.rating) as AssessmentRating | undefined;
  const page = Number(first(params.page) || "1");

  const result = await listDemonstrations(companyId, {
    q,
    rating,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Practical Demonstrations"
        description="Permanent competency evaluations with progression tracking against required successful demonstrations."
      />
      <Suspense fallback={null}>
        <DemonstrationList
          result={result.data}
          error={result.error}
          canManage={canWrite(profile.role)}
          filters={{ q, rating }}
        />
      </Suspense>
    </div>
  );
}
