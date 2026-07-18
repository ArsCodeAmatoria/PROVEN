import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { AssessmentList } from "@/features/assessments/components/assessment-list";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { listAssessments } from "@/services/assessments.service";

export const metadata: Metadata = {
  title: "Assessments",
};

interface AssessmentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AssessmentsPage({
  searchParams,
}: AssessmentsPageProps) {
  await requirePermission("assessments");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;
  const q = first(params.q)?.trim() || undefined;
  const page = Number(first(params.page) || "1");

  const result = await listAssessments(companyId, {
    q,
    page: Number.isFinite(page) ? page : 1,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competency Assessments"
        description="Permanent field assessments with ratings, notes, signatures, media, and competency trends."
      />
      <Suspense fallback={null}>
        <AssessmentList
          result={result.data}
          error={result.error}
          canManage={canWrite(profile.role)}
          filters={{ q }}
        />
      </Suspense>
    </div>
  );
}
