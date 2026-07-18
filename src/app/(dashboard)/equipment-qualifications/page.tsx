import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { EquipmentQualificationList } from "@/features/equipment-qualifications/components/equipment-qualification-list";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import type { EquipmentQualificationStatus } from "@/generated/prisma/client";
import {
  ensureDefaultEquipmentTypes,
  getEquipmentQualificationOptions,
  listEquipmentQualifications,
} from "@/services/equipment-qualifications.service";

export const metadata: Metadata = {
  title: "Equipment Qualifications",
};

interface EquipmentQualificationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EquipmentQualificationsPage({
  searchParams,
}: EquipmentQualificationsPageProps) {
  await requirePermission("equipment-qualifications");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  const params = await searchParams;

  const filters = {
    q: first(params.q)?.trim() || undefined,
    employeeId: first(params.employeeId) || undefined,
    equipmentTypeId: first(params.equipmentTypeId) || undefined,
    status: first(params.status) as EquipmentQualificationStatus | undefined,
  };
  const page = Number(first(params.page) || "1");

  await ensureDefaultEquipmentTypes(companyId, profile.id);

  const [list, options] = await Promise.all([
    listEquipmentQualifications(companyId, {
      ...filters,
      page: Number.isFinite(page) ? page : 1,
      pageSize: 20,
    }),
    getEquipmentQualificationOptions(companyId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipment Qualifications"
        description="Qualify workers on specific equipment classes with make, model, capacity, assessor, and supporting assessments."
      />
      <Suspense fallback={null}>
        <EquipmentQualificationList
          result={list.data}
          error={list.error}
          canManage={canWrite(profile.role)}
          filters={filters}
          employees={options.data?.employees ?? []}
          equipmentTypes={options.data?.equipmentTypes ?? []}
        />
      </Suspense>
    </div>
  );
}
