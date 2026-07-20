import "server-only";

import type { CompanyFolder, Document } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";
import { notDeleted } from "@/types";

import { failure, getDatabaseConfigError, success, unavailable } from "./base";

export type FilesBrowserFolder = CompanyFolder & {
  _count: { children: number; documents: number };
};

export type FilesBrowserFile = Document;

export type FilesBrowserView = {
  folderId: string | null;
  folder: CompanyFolder | null;
  breadcrumbs: { id: string | null; name: string }[];
  folders: FilesBrowserFolder[];
  files: FilesBrowserFile[];
};

async function buildBreadcrumbs(
  companyId: string,
  folderId: string | null,
): Promise<{ id: string | null; name: string }[]> {
  const crumbs: { id: string | null; name: string }[] = [
    { id: null, name: "Files" },
  ];
  if (!folderId) return crumbs;

  const chain: CompanyFolder[] = [];
  let currentId: string | null = folderId;
  while (currentId) {
    const folder: CompanyFolder | null = await prisma.companyFolder.findFirst({
      where: { id: currentId, companyId, ...notDeleted },
    });
    if (!folder) break;
    chain.unshift(folder);
    currentId = folder.parentId;
  }
  for (const folder of chain) {
    crumbs.push({ id: folder.id, name: folder.name });
  }
  return crumbs;
}

/**
 * Organize legacy RTO Safety Program documents into a Safety Program folder once
 * when they still sit at the company library root.
 */
async function ensureLegacyCompanyDocsFolder(companyId: string) {
  const looseCount = await prisma.document.count({
    where: {
      companyId,
      entityType: "COMPANY",
      entityId: companyId,
      folderId: null,
      description: { startsWith: "RTO Safety Program 2025:" },
      ...notDeleted,
    },
  });
  if (looseCount === 0) return;

  let folder = await prisma.companyFolder.findFirst({
    where: {
      companyId,
      parentId: null,
      name: "Safety Program",
      ...notDeleted,
    },
  });
  if (!folder) {
    folder = await prisma.companyFolder.create({
      data: {
        companyId,
        parentId: null,
        name: "Safety Program",
      },
    });
  }

  await prisma.document.updateMany({
    where: {
      companyId,
      entityType: "COMPANY",
      entityId: companyId,
      folderId: null,
      description: { startsWith: "RTO Safety Program 2025:" },
      ...notDeleted,
    },
    data: { folderId: folder.id },
  });
}

export async function getFilesBrowser(
  companyId: string,
  folderId?: string | null,
): Promise<ServiceResult<FilesBrowserView>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    await ensureLegacyCompanyDocsFolder(companyId);

    const currentFolderId = folderId || null;
    let folder: CompanyFolder | null = null;
    if (currentFolderId) {
      folder = await prisma.companyFolder.findFirst({
        where: { id: currentFolderId, companyId, ...notDeleted },
      });
      if (!folder) return unavailable("Folder not found");
    }

    const [folders, files, breadcrumbs] = await Promise.all([
      prisma.companyFolder.findMany({
        where: {
          companyId,
          parentId: currentFolderId,
          ...notDeleted,
        },
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              children: { where: notDeleted },
              documents: { where: notDeleted },
            },
          },
        },
      }),
      prisma.document.findMany({
        where: {
          companyId,
          entityType: "COMPANY",
          entityId: companyId,
          folderId: currentFolderId,
          ...notDeleted,
        },
        orderBy: [{ title: "asc" }],
      }),
      buildBreadcrumbs(companyId, currentFolderId),
    ]);

    return success({
      folderId: currentFolderId,
      folder,
      breadcrumbs,
      folders,
      files,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function createCompanyFolder(
  companyId: string,
  input: {
    name: string;
    parentId?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<CompanyFolder>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const name = input.name.trim();
    if (!name) return unavailable("Folder name is required");
    if (name.length > 120) return unavailable("Folder name is too long");

    if (input.parentId) {
      const parent = await prisma.companyFolder.findFirst({
        where: { id: input.parentId, companyId, ...notDeleted },
      });
      if (!parent) return unavailable("Parent folder not found");
    }

    const existing = await prisma.companyFolder.findFirst({
      where: {
        companyId,
        parentId: input.parentId ?? null,
        name,
        ...notDeleted,
      },
    });
    if (existing) return unavailable("A folder with that name already exists");

    const folder = await prisma.companyFolder.create({
      data: {
        companyId,
        parentId: input.parentId ?? null,
        name,
        createdById: input.createdById ?? null,
      },
    });
    return success(folder);
  } catch (error) {
    return failure(error);
  }
}

export async function renameCompanyFolder(
  companyId: string,
  folderId: string,
  name: string,
): Promise<ServiceResult<CompanyFolder>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const trimmed = name.trim();
    if (!trimmed) return unavailable("Folder name is required");

    const folder = await prisma.companyFolder.findFirst({
      where: { id: folderId, companyId, ...notDeleted },
    });
    if (!folder) return unavailable("Folder not found");

    const updated = await prisma.companyFolder.update({
      where: { id: folder.id },
      data: { name: trimmed },
    });
    return success(updated);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteCompanyFolder(
  companyId: string,
  folderId: string,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const folder = await prisma.companyFolder.findFirst({
      where: { id: folderId, companyId, ...notDeleted },
      include: {
        _count: {
          select: {
            children: { where: notDeleted },
            documents: { where: notDeleted },
          },
        },
      },
    });
    if (!folder) return unavailable("Folder not found");
    if (folder._count.children > 0 || folder._count.documents > 0) {
      return unavailable("Folder must be empty before deleting");
    }

    await prisma.companyFolder.update({
      where: { id: folder.id },
      data: { deletedAt: new Date() },
    });
    return success({ id: folder.id });
  } catch (error) {
    return failure(error);
  }
}

export async function createCompanyFileDocument(
  companyId: string,
  input: {
    folderId?: string | null;
    title: string;
    description?: string | null;
    storagePath: string;
    url: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    uploadedById?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<Document>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    if (input.folderId) {
      const folder = await prisma.companyFolder.findFirst({
        where: { id: input.folderId, companyId, ...notDeleted },
      });
      if (!folder) return unavailable("Folder not found");
    }

    const doc = await prisma.document.create({
      data: {
        companyId,
        folderId: input.folderId ?? null,
        entityType: "COMPANY",
        entityId: companyId,
        title: input.title.trim() || "Untitled",
        description: input.description ?? null,
        storagePath: input.storagePath,
        url: input.url,
        mimeType: input.mimeType ?? null,
        sizeBytes: input.sizeBytes ?? null,
        uploadedById: input.uploadedById ?? null,
        createdById: input.createdById ?? null,
      },
    });
    return success(doc);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteCompanyFile(
  companyId: string,
  documentId: string,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const doc = await prisma.document.findFirst({
      where: {
        id: documentId,
        companyId,
        entityType: "COMPANY",
        entityId: companyId,
        ...notDeleted,
      },
    });
    if (!doc) return unavailable("File not found");

    await prisma.document.update({
      where: { id: doc.id },
      data: { deletedAt: new Date() },
    });
    return success({ id: doc.id });
  } catch (error) {
    return failure(error);
  }
}

export async function moveCompanyFile(
  companyId: string,
  documentId: string,
  folderId: string | null,
): Promise<ServiceResult<Document>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const doc = await prisma.document.findFirst({
      where: {
        id: documentId,
        companyId,
        entityType: "COMPANY",
        entityId: companyId,
        ...notDeleted,
      },
    });
    if (!doc) return unavailable("File not found");

    if (folderId) {
      const folder = await prisma.companyFolder.findFirst({
        where: { id: folderId, companyId, ...notDeleted },
      });
      if (!folder) return unavailable("Folder not found");
    }

    const updated = await prisma.document.update({
      where: { id: doc.id },
      data: { folderId },
    });
    return success(updated);
  } catch (error) {
    return failure(error);
  }
}
