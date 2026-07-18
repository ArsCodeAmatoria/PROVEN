import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ObservationDetailView } from "@/features/observations/components/observation-detail";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getObservationById } from "@/services/observations.service";

interface ObservationPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ObservationPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Observation ${id.slice(0, 8)}` };
}

export default async function ObservationDetailPage({
  params,
}: ObservationPageProps) {
  await requirePermission("observations");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;

  const result = await getObservationById(companyId, id);
  if (!result.data) {
    notFound();
  }

  return (
    <ObservationDetailView
      observation={result.data}
      canManage={canWrite(profile.role)}
    />
  );
}
