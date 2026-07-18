"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { createDemonstrationSchema } from "@/lib/validations/demonstration";
import { createPracticalDemonstration } from "@/services/demonstrations.service";

export async function createDemonstrationAction(input: unknown) {
  await requirePermission("demonstrations");
  const profile = await requireAuth();

  if (!canWrite(profile.role)) {
    return { error: "You do not have permission to record demonstrations." };
  }

  const { companyId } = await requireCompanyId();
  const parsed = createDemonstrationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createPracticalDemonstration(
    companyId,
    parsed.data,
    {
      userId: profile.id,
      employeeId: profile.employeeId,
    },
  );

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to record demonstration." };
  }

  revalidatePath("/demonstrations");
  revalidatePath(`/people/${parsed.data.employeeId}`);
  redirect(`/demonstrations/${result.data.id}`);
}
