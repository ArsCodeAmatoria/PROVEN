import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EquipmentQualificationForm } from "@/features/equipment-qualifications/components/equipment-qualification-form";
import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  ensureDefaultEquipmentTypes,
  getEquipmentQualificationOptions,
} from "@/services/equipment-qualifications.service";

export const metadata: Metadata = {
  title: "Add equipment qualification",
};

export default async function NewEquipmentQualificationPage() {
  await requirePermission("equipment-qualifications");
  const profile = await requireAuth();

  if (!canWrite(profile.role)) {
    redirect("/equipment-qualifications");
  }

  const { companyId } = await requireCompanyId();
  await ensureDefaultEquipmentTypes(companyId, profile.id);
  const options = await getEquipmentQualificationOptions(companyId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add equipment qualification"
        description="Record an equipment endorsement with make, model, capacity, assessor, and optional supporting assessments."
      />
      <EquipmentQualificationForm
        options={
          options.data ?? {
            employees: [],
            assessors: [],
            equipmentTypes: [],
            equipment: [],
            assessments: [],
          }
        }
        defaultAssessorId={profile.employeeId ?? ""}
      />
    </div>
  );
}
