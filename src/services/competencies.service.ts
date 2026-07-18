import "server-only";

import type {
  AuditLog,
  Competency,
  CompetencyCategory,
  CompetencyCriterion,
  Document,
  Prisma,
} from "@/generated/prisma/client";
import type {
  CreateCompetencyCategoryInput,
  CreateCompetencyInput,
  UpdateCompetencyCategoryInput,
  UpdateCompetencyInput,
} from "@/lib/validations/competency";
import { prisma } from "@/lib/prisma";
import type {
  PaginatedResult,
  PaginationParams,
  ServiceResult,
} from "@/types";
import { notDeleted } from "@/types";

import {
  failure,
  getDatabaseConfigError,
  normalizePagination,
  success,
  toPaginatedResult,
  unavailable,
} from "./base";

const DEFAULT_COMPETENCY_CATEGORIES = [
  {
    code: "TOWER_CRANE",
    name: "Tower Crane",
    description: "Tower crane operation, setup, and lift planning competencies.",
    sortOrder: 10,
  },
  {
    code: "MOBILE_CRANE",
    name: "Mobile Crane",
    description: "Mobile crane operation, mobility, and site setup competencies.",
    sortOrder: 20,
  },
  {
    code: "RIGGING",
    name: "Rigging",
    description: "Rigging hardware, load control, and signaling competencies.",
    sortOrder: 30,
  },
  {
    code: "CONCRETE",
    name: "Concrete",
    description: "Concrete placement, finishing, and curing competencies.",
    sortOrder: 40,
  },
  {
    code: "FORMWORK",
    name: "Formwork",
    description: "Formwork assembly, inspection, and stripping competencies.",
    sortOrder: 50,
  },
  {
    code: "MATERIAL_HANDLING",
    name: "Material Handling",
    description: "Material movement, storage, and equipment handling competencies.",
    sortOrder: 60,
  },
  {
    code: "SAFETY",
    name: "Safety",
    description: "Site safety, hazard control, and regulatory compliance competencies.",
    sortOrder: 70,
  },
  {
    code: "GENERAL_CONSTRUCTION",
    name: "General Construction",
    description: "Cross-trade construction fundamentals and site practices.",
    sortOrder: 80,
  },
] as const;

export type CompetencyListItem = Competency & {
  category: CompetencyCategory | null;
  attachmentCount: number;
};

export type CompetencyCategoryNode = CompetencyCategory & {
  children: CompetencyCategoryNode[];
  competencyCount: number;
};

export type CompetencyDetail = Competency & {
  category: CompetencyCategory | null;
  criteria: CompetencyCriterion[];
  attachments: Document[];
  auditLogs: AuditLog[];
};

export type CompetencyListFilters = PaginationParams & {
  q?: string;
  status?: string;
  difficulty?: string;
  categoryId?: string;
};

function emptyToNull(value?: string | null) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildListWhere(
  companyId: string,
  filters: CompetencyListFilters,
): Prisma.CompetencyWhereInput {
  const q = filters.q?.trim();

  return {
    companyId,
    ...notDeleted,
    ...(filters.status
      ? { status: filters.status as Competency["status"] }
      : {}),
    ...(filters.difficulty
      ? { difficulty: filters.difficulty as Competency["difficulty"] }
      : {}),
    ...(filters.categoryId
      ? {
          OR: [
            { categoryId: filters.categoryId },
            { category: { parentId: filters.categoryId, ...notDeleted } },
          ],
        }
      : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { trade: { contains: q, mode: "insensitive" } },
            { reference: { contains: q, mode: "insensitive" } },
            { csaReference: { contains: q, mode: "insensitive" } },
            { asmeReference: { contains: q, mode: "insensitive" } },
            { workSafeBcReference: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function ensureDefaultCompetencyCategories(
  companyId: string,
  createdById?: string | null,
): Promise<ServiceResult<CompetencyCategory[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.competencyCategory.findMany({
      where: { companyId, ...notDeleted },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    if (existing.length > 0) {
      return success(existing);
    }

    await prisma.competencyCategory.createMany({
      data: DEFAULT_COMPETENCY_CATEGORIES.map((category) => ({
        companyId,
        code: category.code,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        createdById: createdById ?? null,
      })),
      skipDuplicates: true,
    });

    const seeded = await prisma.competencyCategory.findMany({
      where: { companyId, ...notDeleted },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return success(seeded);
  } catch (error) {
    return failure(error);
  }
}

export async function listCompetencyCategories(
  companyId: string,
  createdById?: string | null,
): Promise<ServiceResult<CompetencyCategoryNode[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    await ensureDefaultCompetencyCategories(companyId, createdById);

    const categories = await prisma.competencyCategory.findMany({
      where: { companyId, ...notDeleted },
      include: {
        _count: {
          select: {
            competencies: { where: notDeleted },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    const byParent = new Map<string | null, typeof categories>();
    for (const category of categories) {
      const key = category.parentId;
      const list = byParent.get(key) ?? [];
      list.push(category);
      byParent.set(key, list);
    }

    const buildTree = (parentId: string | null): CompetencyCategoryNode[] => {
      const nodes = byParent.get(parentId) ?? [];
      return nodes.map((node) => {
        const { _count, ...category } = node;
        return {
          ...category,
          competencyCount: _count.competencies,
          children: buildTree(node.id),
        };
      });
    };

    return success(buildTree(null));
  } catch (error) {
    return failure(error);
  }
}

export async function listCompetencyCategoryOptions(
  companyId: string,
  excludeCategoryId?: string,
): Promise<ServiceResult<{ id: string; label: string; depth: number }[]>> {
  const tree = await listCompetencyCategories(companyId);
  if (tree.error || !tree.data) {
    return { data: null, error: tree.error };
  }

  const options: { id: string; label: string; depth: number }[] = [];

  const walk = (nodes: CompetencyCategoryNode[], depth: number) => {
    for (const node of nodes) {
      if (node.id === excludeCategoryId) continue;
      options.push({
        id: node.id,
        label: `${"— ".repeat(depth)}${node.name}`,
        depth,
      });
      walk(node.children, depth + 1);
    }
  };

  walk(tree.data, 0);
  return success(options);
}

export async function createCompetencyCategory(
  companyId: string,
  input: CreateCompetencyCategoryInput,
  createdById?: string | null,
): Promise<ServiceResult<CompetencyCategory>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    if (input.parentId) {
      const parent = await prisma.competencyCategory.findFirst({
        where: { id: input.parentId, companyId, ...notDeleted },
      });
      if (!parent) {
        return { data: null, error: "Parent category not found." };
      }
    }

    const category = await prisma.competencyCategory.create({
      data: {
        companyId,
        parentId: input.parentId || null,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        description: emptyToNull(input.description) ?? null,
        sortOrder: input.sortOrder ?? 0,
        createdById: createdById ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: createdById ?? null,
        action: "CREATE",
        entityType: "CompetencyCategory",
        entityId: category.id,
        summary: `Created category ${category.name}`,
      },
    });

    return success(category);
  } catch (error) {
    return failure(error);
  }
}

export async function updateCompetencyCategory(
  companyId: string,
  categoryId: string,
  input: UpdateCompetencyCategoryInput,
  actorUserId?: string | null,
): Promise<ServiceResult<CompetencyCategory>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.competencyCategory.findFirst({
      where: { id: categoryId, companyId, ...notDeleted },
    });
    if (!existing) {
      return { data: null, error: "Category not found." };
    }

    if (input.parentId === categoryId) {
      return { data: null, error: "A category cannot be its own parent." };
    }

    if (input.parentId) {
      const parent = await prisma.competencyCategory.findFirst({
        where: { id: input.parentId, companyId, ...notDeleted },
      });
      if (!parent) {
        return { data: null, error: "Parent category not found." };
      }
    }

    const category = await prisma.competencyCategory.update({
      where: { id: categoryId },
      data: {
        parentId: input.parentId || null,
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        description: emptyToNull(input.description) ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "UPDATE",
        entityType: "CompetencyCategory",
        entityId: categoryId,
        summary: `Updated category ${category.name}`,
      },
    });

    return success(category);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteCompetencyCategory(
  companyId: string,
  categoryId: string,
  actorUserId?: string | null,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.competencyCategory.findFirst({
      where: { id: categoryId, companyId, ...notDeleted },
      include: {
        children: { where: notDeleted, take: 1 },
        competencies: { where: notDeleted, take: 1 },
      },
    });

    if (!existing) {
      return { data: null, error: "Category not found." };
    }

    if (existing.children.length > 0) {
      return {
        data: null,
        error: "Remove or reassign nested categories before deleting.",
      };
    }

    if (existing.competencies.length > 0) {
      return {
        data: null,
        error: "Reassign competencies before deleting this category.",
      };
    }

    await prisma.competencyCategory.update({
      where: { id: categoryId },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "DELETE",
        entityType: "CompetencyCategory",
        entityId: categoryId,
        summary: `Deleted category ${existing.name}`,
      },
    });

    return success({ id: categoryId });
  } catch (error) {
    return failure(error);
  }
}

export async function listCompetencies(
  companyId: string,
  filters: CompetencyListFilters = {},
): Promise<ServiceResult<PaginatedResult<CompetencyListItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(filters);
    const where = buildListWhere(companyId, filters);

    const [rows, total] = await Promise.all([
      prisma.competency.findMany({
        where,
        include: { category: true },
        orderBy: [{ title: "asc" }, { code: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.competency.count({ where }),
    ]);

    const attachmentCounts = await prisma.document.groupBy({
      by: ["entityId"],
      where: {
        companyId,
        entityType: "COMPETENCY",
        entityId: { in: rows.map((row) => row.id) },
        ...notDeleted,
      },
      _count: { _all: true },
    });

    const countById = new Map(
      attachmentCounts.map((row) => [row.entityId, row._count._all]),
    );

    const items: CompetencyListItem[] = rows.map((row) => ({
      ...row,
      attachmentCount: countById.get(row.id) ?? 0,
    }));

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function getCompetencyById(
  companyId: string,
  competencyId: string,
): Promise<ServiceResult<CompetencyDetail>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const competency = await prisma.competency.findFirst({
      where: { id: competencyId, companyId, ...notDeleted },
      include: {
        category: true,
        criteria: {
          where: notDeleted,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!competency) {
      return { data: null, error: "Competency not found." };
    }

    const [attachments, auditLogs] = await Promise.all([
      prisma.document.findMany({
        where: {
          companyId,
          entityType: "COMPETENCY",
          entityId: competencyId,
          ...notDeleted,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: "Competency",
          entityId: competencyId,
          ...notDeleted,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return success({
      ...competency,
      attachments,
      auditLogs,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function createCompetency(
  companyId: string,
  input: CreateCompetencyInput,
  createdById?: string | null,
): Promise<ServiceResult<CompetencyListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    if (input.categoryId) {
      const category = await prisma.competencyCategory.findFirst({
        where: { id: input.categoryId, companyId, ...notDeleted },
      });
      if (!category) {
        return { data: null, error: "Category not found." };
      }
    }

    const competency = await prisma.competency.create({
      data: {
        companyId,
        categoryId: input.categoryId || null,
        code: input.code.trim().toUpperCase(),
        title: input.title.trim(),
        description: input.description.trim(),
        reference: emptyToNull(input.reference) ?? null,
        csaReference: emptyToNull(input.csaReference) ?? null,
        asmeReference: emptyToNull(input.asmeReference) ?? null,
        workSafeBcReference: emptyToNull(input.workSafeBcReference) ?? null,
        requiredDemonstrations:
          emptyToNull(input.requiredDemonstrations) ?? null,
        requiredDemonstrationCount: input.requiredDemonstrationCount ?? null,
        requiredScore: input.requiredScore ?? null,
        difficulty: input.difficulty,
        estimatedTimeMinutes: input.estimatedTimeMinutes ?? null,
        trade: emptyToNull(input.trade) ?? null,
        level: input.level,
        status: input.status,
        createdById: createdById ?? null,
      },
      include: { category: true },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: createdById ?? null,
        action: "CREATE",
        entityType: "Competency",
        entityId: competency.id,
        summary: `Created competency ${competency.title}`,
        afterData: {
          code: competency.code,
          status: competency.status,
          categoryId: competency.categoryId,
        },
      },
    });

    return success({ ...competency, attachmentCount: 0 });
  } catch (error) {
    return failure(error);
  }
}

export async function updateCompetency(
  companyId: string,
  competencyId: string,
  input: UpdateCompetencyInput,
  actorUserId?: string | null,
): Promise<ServiceResult<CompetencyListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.competency.findFirst({
      where: { id: competencyId, companyId, ...notDeleted },
    });
    if (!existing) {
      return { data: null, error: "Competency not found." };
    }

    if (input.categoryId) {
      const category = await prisma.competencyCategory.findFirst({
        where: { id: input.categoryId, companyId, ...notDeleted },
      });
      if (!category) {
        return { data: null, error: "Category not found." };
      }
    }

    const competency = await prisma.competency.update({
      where: { id: competencyId },
      data: {
        categoryId: input.categoryId || null,
        code: input.code.trim().toUpperCase(),
        title: input.title.trim(),
        description: input.description.trim(),
        reference: emptyToNull(input.reference) ?? null,
        csaReference: emptyToNull(input.csaReference) ?? null,
        asmeReference: emptyToNull(input.asmeReference) ?? null,
        workSafeBcReference: emptyToNull(input.workSafeBcReference) ?? null,
        requiredDemonstrations:
          emptyToNull(input.requiredDemonstrations) ?? null,
        requiredDemonstrationCount: input.requiredDemonstrationCount ?? null,
        requiredScore: input.requiredScore ?? null,
        difficulty: input.difficulty,
        estimatedTimeMinutes: input.estimatedTimeMinutes ?? null,
        trade: emptyToNull(input.trade) ?? null,
        level: input.level,
        status: input.status,
      },
      include: { category: true },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "UPDATE",
        entityType: "Competency",
        entityId: competencyId,
        summary: `Updated competency ${competency.title}`,
        beforeData: {
          code: existing.code,
          status: existing.status,
          categoryId: existing.categoryId,
        },
        afterData: {
          code: competency.code,
          status: competency.status,
          categoryId: competency.categoryId,
        },
      },
    });

    const attachmentCount = await prisma.document.count({
      where: {
        companyId,
        entityType: "COMPETENCY",
        entityId: competencyId,
        ...notDeleted,
      },
    });

    return success({ ...competency, attachmentCount });
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteCompetency(
  companyId: string,
  competencyId: string,
  actorUserId?: string | null,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.competency.findFirst({
      where: { id: competencyId, companyId, ...notDeleted },
    });
    if (!existing) {
      return { data: null, error: "Competency not found." };
    }

    await prisma.competency.update({
      where: { id: competencyId },
      data: {
        deletedAt: new Date(),
        status: "ARCHIVED",
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "DELETE",
        entityType: "Competency",
        entityId: competencyId,
        summary: `Archived competency ${existing.title}`,
      },
    });

    return success({ id: competencyId });
  } catch (error) {
    return failure(error);
  }
}

export async function addCompetencyAttachment(
  companyId: string,
  competencyId: string,
  data: {
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
    const competency = await prisma.competency.findFirst({
      where: { id: competencyId, companyId, ...notDeleted },
    });
    if (!competency) {
      return { data: null, error: "Competency not found." };
    }

    const document = await prisma.document.create({
      data: {
        companyId,
        entityType: "COMPETENCY",
        entityId: competencyId,
        title: data.title,
        description: data.description ?? null,
        storagePath: data.storagePath,
        url: data.url,
        mimeType: data.mimeType ?? null,
        sizeBytes: data.sizeBytes ?? null,
        uploadedById: data.uploadedById ?? null,
        createdById: data.createdById ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: data.createdById ?? null,
        action: "CREATE",
        entityType: "Document",
        entityId: document.id,
        summary: `Attached ${document.title} to competency ${competency.title}`,
      },
    });

    return success(document);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteCompetencyAttachment(
  companyId: string,
  competencyId: string,
  documentId: string,
  actorUserId?: string | null,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        companyId,
        entityType: "COMPETENCY",
        entityId: competencyId,
        ...notDeleted,
      },
    });
    if (!document) {
      return { data: null, error: "Attachment not found." };
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "DELETE",
        entityType: "Document",
        entityId: documentId,
        summary: `Removed attachment ${document.title}`,
      },
    });

    return success({ id: documentId });
  } catch (error) {
    return failure(error);
  }
}
