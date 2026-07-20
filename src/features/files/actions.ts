"use server";

import { revalidatePath } from "next/cache";

import { canWrite, isAdminRole } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/roles";
import {
  requireAuth,
  requireCompanyId,
  requirePermission,
} from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createCompanyFileDocument,
  createCompanyFolder,
  renameCompanyFolder,
  softDeleteCompanyFile,
  softDeleteCompanyFolder,
} from "@/services/files.service";

const BUCKET = "company-files";

function canManageFiles(role: UserRole) {
  return (
    canWrite(role) &&
    (isAdminRole(role) || role === "SUPERVISOR" || role === "INSTRUCTOR")
  );
}

async function requireFilesAccess() {
  await requirePermission("files");
  const profile = await requireAuth();
  const { companyId } = await requireCompanyId();
  return { profile, companyId };
}

async function requireFilesWrite() {
  const gate = await requireFilesAccess();
  if (!canManageFiles(gate.profile.role)) {
    return {
      ...gate,
      error: "You do not have permission to manage company files.",
    };
  }
  return { ...gate, error: null };
}

async function ensureBucket(admin: {
  storage: {
    listBuckets: () => Promise<{ data: { id: string; name: string }[] | null }>;
    createBucket: (
      id: string,
      options: { public: boolean; fileSizeLimit?: number },
    ) => Promise<{ error: { message: string } | null }>;
  };
}) {
  const { data } = await admin.storage.listBuckets();
  if (!data?.some((b) => b.id === BUCKET || b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
    });
  }
}

export async function createFolderAction(input: {
  name: string;
  parentId?: string | null;
}) {
  const gate = await requireFilesWrite();
  if (gate.error) return { error: gate.error };

  const result = await createCompanyFolder(gate.companyId, {
    name: input.name,
    parentId: input.parentId ?? null,
    createdById: gate.profile.id,
  });
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create folder." };
  }

  revalidatePath("/files");
  return { ok: true, folderId: result.data.id };
}

export async function renameFolderAction(input: {
  folderId: string;
  name: string;
}) {
  const gate = await requireFilesWrite();
  if (gate.error) return { error: gate.error };

  const result = await renameCompanyFolder(
    gate.companyId,
    input.folderId,
    input.name,
  );
  if (result.error) return { error: result.error };

  revalidatePath("/files");
  return { ok: true };
}

export async function deleteFolderAction(folderId: string) {
  const gate = await requireFilesWrite();
  if (gate.error) return { error: gate.error };

  const result = await softDeleteCompanyFolder(gate.companyId, folderId);
  if (result.error) return { error: result.error };

  revalidatePath("/files");
  return { ok: true };
}

export async function uploadCompanyFileAction(
  folderId: string | null,
  formData: FormData,
) {
  const gate = await requireFilesWrite();
  if (gate.error) return { error: gate.error };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > 100 * 1024 * 1024) {
    return { error: "Files must be 100MB or smaller." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const folderSegment = folderId ?? "root";
  const path = `${gate.companyId}/${folderSegment}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  try {
    const admin = createAdminClient();
    await ensureBucket(admin);

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(
      path,
      file,
      {
        upsert: false,
        contentType: file.type || undefined,
      },
    );
    if (uploadError) return { error: uploadError.message };

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(path);

    const result = await createCompanyFileDocument(gate.companyId, {
      folderId,
      title: file.name,
      storagePath: path,
      url: publicUrl,
      mimeType: file.type || null,
      sizeBytes: file.size,
      uploadedById: gate.profile.employeeId,
      createdById: gate.profile.id,
    });

    if (result.error) return { error: result.error };

    revalidatePath("/files");
    return { ok: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to upload file.",
    };
  }
}

export async function deleteCompanyFileAction(documentId: string) {
  const gate = await requireFilesWrite();
  if (gate.error) return { error: gate.error };

  const result = await softDeleteCompanyFile(gate.companyId, documentId);
  if (result.error) return { error: result.error };

  revalidatePath("/files");
  return { ok: true };
}
