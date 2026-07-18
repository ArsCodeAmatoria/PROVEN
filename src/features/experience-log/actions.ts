"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import {
  createExperienceLogSchema,
  createExperienceMilestoneSchema,
} from "@/lib/validations/experience-log";
import {
  createExperienceLogEntry,
  createExperienceMilestone,
  softDeleteExperienceLog,
} from "@/services/experience-log.service";

async function requireExperienceWrite() {
  await requirePermission("experience-log");
  const profile = await requireAuth();
  if (!canWrite(profile.role)) {
    return {
      profile: null,
      companyId: null,
      error: "You do not have permission to manage experience logs.",
    };
  }
  const { companyId } = await requireCompanyId();
  return { profile, companyId, error: null };
}

export async function createExperienceLogAction(input: unknown) {
  const gate = await requireExperienceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const parsed = createExperienceLogSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createExperienceLogEntry(
    gate.companyId,
    parsed.data,
    { userId: gate.profile.id },
  );

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create experience log." };
  }

  revalidatePath("/experience-log");
  revalidatePath(`/people/${result.data.employee.id}`);
  redirect(`/experience-log/${result.data.id}`);
}

export async function createExperienceMilestoneAction(input: unknown) {
  const gate = await requireExperienceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const parsed = createExperienceMilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createExperienceMilestone(
    gate.companyId,
    parsed.data,
    gate.profile.id,
  );
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create milestone." };
  }

  revalidatePath("/experience-log");
  return { error: null };
}

export async function deleteExperienceLogAction(entryId: string) {
  const gate = await requireExperienceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await softDeleteExperienceLog(
    gate.companyId,
    entryId,
    gate.profile.id,
  );
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/experience-log");
  redirect("/experience-log");
}
