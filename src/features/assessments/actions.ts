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
import { createAssessmentEngineSchema } from "@/lib/validations/assessment";
import {
  addAssessmentPhoto,
  addAssessmentSignatureImage,
  addAssessmentVideo,
  createPermanentAssessment,
} from "@/services/assessments.service";

async function requireAssessmentWrite() {
  await requirePermission("assessments");
  const profile = await requireAuth();
  if (!canWrite(profile.role)) {
    return {
      profile: null,
      companyId: null,
      error: "You do not have permission to record assessments.",
    };
  }
  const { companyId } = await requireCompanyId();
  return { profile, companyId, error: null };
}

export async function createAssessmentAction(input: unknown) {
  const gate = await requireAssessmentWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const parsed = createAssessmentEngineSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createPermanentAssessment(
    gate.companyId,
    parsed.data,
    {
      userId: gate.profile.id,
      employeeId: gate.profile.employeeId,
    },
  );

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create assessment." };
  }

  revalidatePath("/assessments");
  redirect(`/assessments/${result.data.id}`);
}

export async function uploadAssessmentMediaAction(
  assessmentResultId: string,
  formData: FormData,
) {
  const gate = await requireAssessmentWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const file = formData.get("file");
  const kind = String(formData.get("kind") || "photo");
  const caption = String(formData.get("caption") || "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  if (file.size > 50 * 1024 * 1024) {
    return { error: "Media files must be 50MB or smaller." };
  }

  const isVideo = kind === "video" || file.type.startsWith("video/");
  const isImage = kind === "photo" || file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    return { error: "Upload a photo or video file." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${gate.companyId}/${assessmentResultId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("assessment-media")
      .upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("assessment-media").getPublicUrl(path);

    const payload = {
      storagePath: path,
      url: publicUrl,
      caption: caption || null,
      mimeType: file.type || null,
      sizeBytes: file.size,
      uploadedById: gate.profile.employeeId,
      createdById: gate.profile.id,
    };

    const result = isVideo
      ? await addAssessmentVideo(gate.companyId, assessmentResultId, payload)
      : await addAssessmentPhoto(gate.companyId, assessmentResultId, payload);

    if (result.error) return { error: result.error };

    revalidatePath("/assessments");
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to upload media.",
    };
  }
}

export async function uploadAssessmentSignatureAction(
  signatureId: string,
  formData: FormData,
) {
  const gate = await requireAssessmentWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const file = formData.get("signature");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a signature image." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Signature must be an image." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "Signature must be 2MB or smaller." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${gate.companyId}/signatures/${signatureId}/${Date.now()}.${extension}`;

  try {
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("assessment-media")
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = admin.storage.from("assessment-media").getPublicUrl(path);

    const result = await addAssessmentSignatureImage(
      gate.companyId,
      signatureId,
      {
        storagePath: path,
        signatureUrl: publicUrl,
      },
    );

    if (result.error) return { error: result.error };

    revalidatePath("/assessments");
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to upload signature.",
    };
  }
}
