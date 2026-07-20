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
  attachCompanyDocumentsToCorEvidence,
  attachCorEvidenceMedia,
  softDeleteCorEvidenceLink,
  upsertAuditQuestionResponse,
} from "@/services/compliance.service";
import {
  completeManagementReview,
  ensureManagementReview,
  getExternalAuditGate,
  markCorrectiveActionComplete,
  markExternalAuditReady,
  recalculateSessionScores,
  signOffInternalAudit,
  startInternalAuditWithFreeze,
  syncFindingAndCorrectiveAction,
  verifyCorrectiveAction,
} from "@/services/cor-workflow.service";
import { getFilesBrowser } from "@/services/files.service";

const COR_MEDIA_BUCKET = "cor-media";

async function requireComplianceWrite() {
  await requirePermission("compliance");
  const profile = await requireAuth();
  if (!canWrite(profile.role)) {
    return {
      profile: null,
      companyId: null,
      error: "You do not have permission to edit compliance audits.",
    };
  }
  const { companyId } = await requireCompanyId();
  return { profile, companyId, error: null };
}

async function ensureCorMediaBucket(
  admin: ReturnType<typeof createAdminClient>,
) {
  const { data: buckets } = await admin.storage.listBuckets();
  if (
    buckets?.some(
      (b) => b.id === COR_MEDIA_BUCKET || b.name === COR_MEDIA_BUCKET,
    )
  ) {
    return;
  }
  await admin.storage.createBucket(COR_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
  });
}

export async function createInternalAuditAction(formData: FormData) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    throw new Error(gate.error ?? "Unable to create audit session.");
  }

  const title = formData.get("title");
  const result = await startInternalAuditWithFreeze(gate.companyId, {
    title: typeof title === "string" ? title : undefined,
    createdById: gate.profile.id,
    leadEmployeeId: gate.profile.employeeId ?? undefined,
  });

  if (result.error || !result.data) {
    throw new Error(result.error ?? "Unable to create audit session.");
  }

  revalidatePath("/compliance");
  revalidatePath("/compliance/audits");
  revalidatePath("/compliance/corrective-actions");
  redirect(`/compliance/audits/${result.data.sessionId}`);
}

const STATUS_VALUES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ADEQUATE",
  "NEEDS_IMPROVEMENT",
  "FAIL",
  "NOT_APPLICABLE",
] as const;

export async function saveAuditQuestionResponseAction(input: {
  sessionId: string;
  questionId: string;
  status: string;
  comments?: string;
  observationNotes?: string;
  interviewNotes?: string;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  if (!STATUS_VALUES.includes(input.status as (typeof STATUS_VALUES)[number])) {
    return { error: "Invalid status." };
  }

  const result = await upsertAuditQuestionResponse(gate.companyId, {
    sessionId: input.sessionId,
    questionId: input.questionId,
    status: input.status as (typeof STATUS_VALUES)[number],
    comments: input.comments ?? null,
    observationNotes: input.observationNotes ?? null,
    interviewNotes: input.interviewNotes ?? null,
    createdById: gate.profile.id,
  });

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to save response." };
  }

  await syncFindingAndCorrectiveAction(gate.companyId, {
    sessionId: input.sessionId,
    questionId: input.questionId,
    status: input.status as (typeof STATUS_VALUES)[number],
    comments: input.comments ?? null,
    createdById: gate.profile.id,
  });
  await recalculateSessionScores(gate.companyId, input.sessionId);

  revalidatePath(`/compliance/audits/${input.sessionId}`);
  revalidatePath("/compliance/audits");
  revalidatePath("/compliance/corrective-actions");
  revalidatePath("/compliance/reports");
  revalidatePath("/compliance");
  return { ok: true };
}

export async function uploadCorEvidenceAction(
  sessionId: string,
  questionId: string,
  formData: FormData,
) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const file = formData.get("file");
  const kindRaw = String(formData.get("kind") || "photo");
  const evidenceKindRaw = String(formData.get("evidenceKind") || "DOCUMENTATION");
  const caption = String(formData.get("caption") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const evidenceKind =
    evidenceKindRaw === "OBSERVATION" || evidenceKindRaw === "INTERVIEW"
      ? evidenceKindRaw
      : "DOCUMENTATION";

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > 50 * 1024 * 1024) {
    return { error: "Files must be 50MB or smaller." };
  }

  const kind =
    kindRaw === "document" || kindRaw === "video" || kindRaw === "photo"
      ? kindRaw
      : file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("image/")
          ? "photo"
          : "document";

  if (kind === "photo" && file.type && !file.type.startsWith("image/")) {
    return { error: "Upload an image file for photos." };
  }
  if (kind === "video" && file.type && !file.type.startsWith("video/")) {
    return { error: "Upload a video file." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${gate.companyId}/${sessionId}/${questionId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    const admin = createAdminClient();
    await ensureCorMediaBucket(admin);

    const { error: uploadError } = await admin.storage
      .from(COR_MEDIA_BUCKET)
      .upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = admin.storage.from(COR_MEDIA_BUCKET).getPublicUrl(path);

    const result = await attachCorEvidenceMedia(gate.companyId, {
      sessionId,
      questionId,
      kind,
      evidenceKind,
      storagePath: path,
      url: publicUrl,
      title: title || file.name,
      caption: caption || null,
      mimeType: file.type || null,
      sizeBytes: file.size,
      uploadedById: gate.profile.employeeId,
      createdById: gate.profile.id,
    });

    if (result.error) return { error: result.error };

    revalidatePath(`/compliance/audits/${sessionId}`);
    revalidatePath("/compliance/evidence");
    return { ok: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to upload evidence.",
    };
  }
}

export async function deleteCorEvidenceAction(
  sessionId: string,
  linkId: string,
) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  const result = await softDeleteCorEvidenceLink(gate.companyId, linkId);
  if (result.error) return { error: result.error };

  revalidatePath(`/compliance/audits/${sessionId}`);
  revalidatePath("/compliance/evidence");
  return { ok: true };
}

export async function browseCompanyFilesForCorAction(folderId?: string | null) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error ?? "Unable to browse files." };
  }

  const result = await getFilesBrowser(gate.companyId, folderId ?? null);
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to load company files." };
  }

  return {
    ok: true as const,
    data: {
      folderId: result.data.folderId,
      breadcrumbs: result.data.breadcrumbs,
      folders: result.data.folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        childCount: folder._count.children,
        fileCount: folder._count.documents,
      })),
      files: result.data.files.map((file) => ({
        id: file.id,
        title: file.title,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        url: file.url,
      })),
    },
  };
}

export async function attachCompanyFilesToCorEvidenceAction(
  sessionId: string,
  questionId: string,
  documentIds: string[],
  evidenceKind?: "DOCUMENTATION" | "OBSERVATION" | "INTERVIEW",
) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }

  if (!documentIds.length) {
    return { error: "Select at least one file to attach." };
  }

  const result = await attachCompanyDocumentsToCorEvidence(gate.companyId, {
    sessionId,
    questionId,
    documentIds,
    evidenceKind: evidenceKind ?? "DOCUMENTATION",
    createdById: gate.profile.id,
  });

  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to attach files." };
  }

  revalidatePath(`/compliance/audits/${sessionId}`);
  revalidatePath("/compliance/evidence");
  return {
    ok: true as const,
    attached: result.data.attached,
    skipped: result.data.skipped,
  };
}

export async function completeCorrectiveActionAction(actionId: string) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }
  const result = await markCorrectiveActionComplete(gate.companyId, actionId, {
    createdById: gate.profile.id,
  });
  if (result.error) return { error: result.error };
  revalidatePath("/compliance/corrective-actions");
  revalidatePath(`/compliance/corrective-actions/${actionId}`);
  revalidatePath("/compliance");
  return { ok: true };
}

export async function verifyCorrectiveActionAction(input: {
  actionId: string;
  approve: boolean;
  evidenceReviewed: boolean;
  deficiencyCorrected: boolean;
  workersInformed: boolean;
  trainingCompleted: boolean;
  documentsUpdated: boolean;
  siteInspected: boolean;
  notes?: string;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }
  const result = await verifyCorrectiveAction(gate.companyId, input.actionId, {
    ...input,
    verifiedById: gate.profile.employeeId ?? null,
    createdById: gate.profile.id,
  });
  if (result.error) return { error: result.error };
  revalidatePath("/compliance/corrective-actions");
  revalidatePath(`/compliance/corrective-actions/${input.actionId}`);
  revalidatePath("/compliance");
  return { ok: true, status: result.data?.status };
}

export async function startManagementReviewAction(sessionId: string) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }
  const result = await ensureManagementReview(
    gate.companyId,
    sessionId,
    gate.profile.id,
  );
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to start management review." };
  }
  revalidatePath(`/compliance/audits/${sessionId}`);
  revalidatePath(`/compliance/audits/${sessionId}/management-review`);
  redirect(`/compliance/audits/${sessionId}/management-review`);
}

export async function completeManagementReviewAction(input: {
  reviewId: string;
  sessionId: string;
  decisions?: string;
  resourcesNotes?: string;
}) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }
  const result = await completeManagementReview(gate.companyId, input.reviewId, {
    decisions: input.decisions,
    resourcesNotes: input.resourcesNotes,
    createdById: gate.profile.id,
  });
  if (result.error) return { error: result.error };
  revalidatePath(`/compliance/audits/${input.sessionId}`);
  revalidatePath(`/compliance/audits/${input.sessionId}/management-review`);
  revalidatePath("/compliance");
  return { ok: true };
}

export async function signOffInternalAuditAction(sessionId: string) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }
  const result = await signOffInternalAudit(
    gate.companyId,
    sessionId,
    gate.profile.employeeId ?? null,
  );
  if (result.error) return { error: result.error };
  revalidatePath(`/compliance/audits/${sessionId}`);
  revalidatePath("/compliance/audits");
  revalidatePath("/compliance");
  return { ok: true };
}

export async function markExternalAuditReadyAction(sessionId: string) {
  const gate = await requireComplianceWrite();
  if (gate.error || !gate.profile || !gate.companyId) {
    return { error: gate.error };
  }
  const gateCheck = await getExternalAuditGate(gate.companyId, sessionId);
  if (!gateCheck.data?.ready) {
    return {
      error:
        gateCheck.data?.blockers.join(" ") ||
        gateCheck.error ||
        "Not ready for external audit.",
    };
  }
  const result = await markExternalAuditReady(gate.companyId, sessionId);
  if (result.error) return { error: result.error };
  revalidatePath(`/compliance/audits/${sessionId}`);
  revalidatePath("/compliance/audits/external");
  revalidatePath("/compliance");
  return { ok: true };
}

export async function startManagementReviewFormAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) throw new Error("Missing session");
  await startManagementReviewAction(sessionId);
}

export async function signOffInternalAuditFormAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) throw new Error("Missing session");
  const result = await signOffInternalAuditAction(sessionId);
  if (result.error) throw new Error(result.error);
}

export async function markExternalAuditReadyFormAction(formData: FormData) {
  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) throw new Error("Missing session");
  const result = await markExternalAuditReadyAction(sessionId);
  if (result.error) throw new Error(result.error);
}

export async function completeCorrectiveActionFormAction(formData: FormData) {
  const actionId = String(formData.get("actionId") || "");
  if (!actionId) throw new Error("Missing action");
  const result = await completeCorrectiveActionAction(actionId);
  if (result.error) throw new Error(result.error);
}
