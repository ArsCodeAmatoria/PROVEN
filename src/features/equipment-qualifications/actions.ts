"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { createEquipmentQualificationSchema } from "@/lib/validations/equipment-qualification";
import {
  createEquipmentQualification,
  softDeleteEquipmentQualification,
} from "@/services/equipment-qualifications.service";

async function requireQualificationWrite() {
  await requirePermission("equipment-qualifications");
  const profile = await requireAuth();
  if (!canWrite(profile.role)) {
    return {
      profile: null,
      companyId: null,
      error: "You do not have permission to manage equipment qualifications.",
    };
  }
  const { companyId } = await requireCompanyId();
  return { profile, companyId, error: null };
}

export async function createEquipmentQualificationAction(input: unknown) {
  const gate = await requireQualificationWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const parsed = createEquipmentQualificationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createEquipmentQualification(
    gate.companyId,
    parsed.data,
    {
      userId: gate.profile.id,
      employeeId: gate.profile.employeeId,
    },
  );

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create qualification." };
  }

  revalidatePath("/equipment-qualifications");
  revalidatePath(`/people/${result.data.employee.id}`);
  redirect(`/equipment-qualifications/${result.data.id}`);
}

export async function deleteEquipmentQualificationAction(
  qualificationId: string,
) {
  const gate = await requireQualificationWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await softDeleteEquipmentQualification(
    gate.companyId,
    qualificationId,
    gate.profile.id,
  );
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to delete qualification." };
  }

  revalidatePath("/equipment-qualifications");
  revalidatePath(`/people/${result.data.employeeId}`);
  redirect("/equipment-qualifications");
}
