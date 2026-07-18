"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canWrite } from "@/lib/auth/permissions";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCompetencyCategorySchema,
  createCompetencySchema,
  updateCompetencyCategorySchema,
  updateCompetencySchema,
} from "@/lib/validations/competency";
import {
  addCompetencyAttachment,
  createCompetency,
  createCompetencyCategory,
  softDeleteCompetency,
  softDeleteCompetencyAttachment,
  softDeleteCompetencyCategory,
  updateCompetency,
  updateCompetencyCategory,
} from "@/services/competencies.service";

async function requireCompetencyWrite() {
  await requirePermission("competencies");
  const profile = await requireAuth();
  if (!canWrite(profile.role)) {
    return { profile: null, error: "You do not have permission to edit competencies." };
  }
  const { companyId } = await requireCompanyId();
  return { profile, companyId, error: null };
}

export async function createCompetencyAction(input: unknown) {
  const gate = await requireCompetencyWrite();
  if (gate.error || !gate.profile) return { error: gate.error };

  const parsed = createCompetencySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createCompetency(
    gate.companyId,
    parsed.data,
    gate.profile.id,
  );
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create competency." };
  }

  revalidatePath("/competencies");
  redirect(`/competencies/${result.data.id}`);
}

export async function updateCompetencyAction(
  competencyId: string,
  input: unknown,
) {
  const gate = await requireCompetencyWrite();
  if (gate.error || !gate.profile) return { error: gate.error };

  const parsed = updateCompetencySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateCompetency(
    gate.companyId,
    competencyId,
    parsed.data,
    gate.profile.id,
  );
  if (result.error) return { error: result.error };

  revalidatePath("/competencies");
  revalidatePath(`/competencies/${competencyId}`);
  revalidatePath(`/competencies/${competencyId}/edit`);
  redirect(`/competencies/${competencyId}`);
}

export async function deleteCompetencyAction(competencyId: string) {
  const gate = await requireCompetencyWrite();
  if (gate.error || !gate.profile) return { error: gate.error };

  const result = await softDeleteCompetency(
    gate.companyId,
    competencyId,
    gate.profile.id,
  );
  if (result.error) return { error: result.error };

  revalidatePath("/competencies");
  redirect("/competencies");
}

export async function createCompetencyCategoryAction(input: unknown) {
  const gate = await requireCompetencyWrite();
  if (gate.error || !gate.profile) return { error: gate.error };

  const parsed = createCompetencyCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createCompetencyCategory(
    gate.companyId,
    parsed.data,
    gate.profile.id,
  );
  if (result.error) return { error: result.error };

  revalidatePath("/competencies");
  return { error: null };
}

export async function updateCompetencyCategoryAction(
  categoryId: string,
  input: unknown,
) {
  const gate = await requireCompetencyWrite();
  if (gate.error || !gate.profile) return { error: gate.error };

  const parsed = updateCompetencyCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateCompetencyCategory(
    gate.companyId,
    categoryId,
    parsed.data,
    gate.profile.id,
  );
  if (result.error) return { error: result.error };

  revalidatePath("/competencies");
  return { error: null };
}

export async function deleteCompetencyCategoryAction(categoryId: string) {
  const gate = await requireCompetencyWrite();
  if (gate.error || !gate.profile) return { error: gate.error };

  const result = await softDeleteCompetencyCategory(
    gate.companyId,
    categoryId,
    gate.profile.id,
  );
  if (result.error) return { error: result.error };

  revalidatePath("/competencies");
  return { error: null };
}

export async function uploadCompetencyAttachmentAction(
  competencyId: string,
  formData: FormData,
) {
  const gate = await requireCompetencyWrite();
  if (gate.error || !gate.profile) return { error: gate.error };

  const file = formData.get("file");
  const title = String(formData.get("title") || "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { error: "Attachments must be 10MB or smaller." };
  }

  const safeTitle = title || file.name;
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${gate.companyId}/${competencyId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("competency-documents")
      .upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("competency-documents").getPublicUrl(path);

    const result = await addCompetencyAttachment(
      gate.companyId,
      competencyId,
      {
        title: safeTitle,
        storagePath: path,
        url: publicUrl,
        mimeType: file.type || null,
        sizeBytes: file.size,
        uploadedById: gate.profile.employeeId,
        createdById: gate.profile.id,
      },
    );

    if (result.error) return { error: result.error };

    revalidatePath(`/competencies/${competencyId}`);
    revalidatePath(`/competencies/${competencyId}/edit`);
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to upload attachment.",
    };
  }
}

export async function deleteCompetencyAttachmentAction(
  competencyId: string,
  documentId: string,
) {
  const gate = await requireCompetencyWrite();
  if (gate.error || !gate.profile) return { error: gate.error };

  const result = await softDeleteCompetencyAttachment(
    gate.companyId,
    competencyId,
    documentId,
    gate.profile.id,
  );
  if (result.error) return { error: result.error };

  revalidatePath(`/competencies/${competencyId}`);
  revalidatePath(`/competencies/${competencyId}/edit`);
  return { error: null };
}
