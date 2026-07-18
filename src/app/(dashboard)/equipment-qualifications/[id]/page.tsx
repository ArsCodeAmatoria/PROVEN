import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EquipmentQualificationDetailView } from "@/features/equipment-qualifications/components/equipment-qualification-detail";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { getEquipmentQualificationById } from "@/services/equipment-qualifications.service";

interface EquipmentQualificationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EquipmentQualificationDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Qualification ${id.slice(0, 8)}` };
}

export default async function EquipmentQualificationDetailPage({
  params,
}: EquipmentQualificationDetailPageProps) {
  await requirePermission("equipment-qualifications");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const { id } = await params;

  const result = await getEquipmentQualificationById(companyId, id);
  if (!result.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <EquipmentQualificationDetailView
        qualification={result.data}
        canManage={canWrite(profile.role)}
      />
    </div>
  );
}
