import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { TrainingMatrixView } from "@/features/training-matrix/components/training-matrix-view";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import type { TrainingMatrixDisplayStatus } from "@/lib/validations/training-matrix";
import {
  getTrainingMatrix,
  getTrainingMatrixFilterOptions,
} from "@/services/training-matrix.service";

export const metadata: Metadata = {
  title: "Training Matrix",
};

interface TrainingMatrixPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TrainingMatrixPage({
  searchParams,
}: TrainingMatrixPageProps) {
  await requirePermission("training-matrix");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;

  const filters = {
    projectId: first(params.projectId) || undefined,
    trade: first(params.trade) || undefined,
    crew: first(params.crew) || undefined,
    supervisorId: first(params.supervisorId) || undefined,
    status: first(params.status) as TrainingMatrixDisplayStatus | undefined,
  };

  const [matrix, options] = await Promise.all([
    getTrainingMatrix(companyId, filters),
    getTrainingMatrixFilterOptions(
      companyId,
      profile.memberships.map((item) => ({
        companyId: item.companyId,
        companyName: item.companyName,
      })),
    ),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Matrix"
        description="Workers by competency with color-coded status, filters, and Excel/PDF export."
      />
      <Suspense fallback={null}>
        <TrainingMatrixView
          data={matrix.data}
          error={matrix.error}
          options={options.data}
          currentCompanyId={companyId}
          filters={filters}
        />
      </Suspense>
    </div>
  );
}
