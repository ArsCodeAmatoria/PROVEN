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
  createObservationSchema,
  updateObservationFollowUpSchema,
} from "@/lib/validations/observation";
import {
  addObservationPhoto,
  addObservationVideo,
  createFieldObservation,
  softDeleteObservation,
  updateObservationFollowUp,
} from "@/services/observations.service";

async function requireObservationWrite() {
  await requirePermission("observations");
  const profile = await requireAuth();
  if (!canWrite(profile.role)) {
    return {
      profile: null,
      companyId: null,
      error: "You do not have permission to record observations.",
    };
  }
  const { companyId } = await requireCompanyId();
  return { profile, companyId, error: null };
}

export async function createObservationAction(input: unknown) {
  const gate = await requireObservationWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const parsed = createObservationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createFieldObservation(gate.companyId, parsed.data, {
    userId: gate.profile.id,
    employeeId: gate.profile.employeeId,
  });

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create observation." };
  }

  revalidatePath("/observations");
  revalidatePath(`/people/${result.data.employeeId}`);
  redirect(`/observations/${result.data.id}`);
}

export async function updateObservationFollowUpAction(
  observationId: string,
  input: unknown,
) {
  const gate = await requireObservationWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const parsed = updateObservationFollowUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateObservationFollowUp(
    gate.companyId,
    observationId,
    parsed.data,
    gate.profile.id,
  );
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to update follow-up." };
  }

  revalidatePath("/observations");
  revalidatePath(`/observations/${observationId}`);
  revalidatePath(`/people/${result.data.employeeId}`);
  return { error: null };
}

export async function deleteObservationAction(observationId: string) {
  const gate = await requireObservationWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const { getObservationById } = await import(
    "@/services/observations.service"
  );
  const existing = await getObservationById(gate.companyId, observationId);

  const result = await softDeleteObservation(
    gate.companyId,
    observationId,
    gate.profile.id,
  );
  if (result.error) return { error: result.error };

  revalidatePath("/observations");
  if (existing.data?.employeeId) {
    revalidatePath(`/people/${existing.data.employeeId}`);
  }
  redirect("/observations");
}

export async function uploadObservationMediaAction(
  observationId: string,
  formData: FormData,
) {
  const gate = await requireObservationWrite();
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
  const path = `${gate.companyId}/${observationId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("observation-media")
      .upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = admin.storage.from("observation-media").getPublicUrl(path);

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
      ? await addObservationVideo(gate.companyId, observationId, payload)
      : await addObservationPhoto(gate.companyId, observationId, payload);

    if (result.error) return { error: result.error };

    revalidatePath(`/observations/${observationId}`);
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to upload media.",
    };
  }
}
