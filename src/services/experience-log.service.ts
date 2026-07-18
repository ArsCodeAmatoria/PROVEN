import "server-only";

import { Prisma } from "@/generated/prisma/client";
import type {
  CreateExperienceLogInput,
  CreateExperienceMilestoneInput,
  ExperienceLogListFiltersInput,
} from "@/lib/validations/experience-log";
import { prisma } from "@/lib/prisma";
import type {
  PaginatedResult,
  PaginationParams,
  ServiceResult,
} from "@/types";
import { notDeleted } from "@/types";
import { fullName } from "@/utils/format";

import {
  failure,
  getDatabaseConfigError,
  normalizePagination,
  success,
  toPaginatedResult,
  unavailable,
} from "./base";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNumber(value: Prisma.Decimal | number | string) {
  return typeof value === "number" ? value : Number(value);
}

export type ExperienceEngineOptions = {
  companyName: string;
  employees: { id: string; label: string; supervisorId: string | null }[];
  projects: { id: string; label: string }[];
  equipment: { id: string; label: string; projectId: string | null }[];
  categories: { id: string; label: string; parentId: string | null }[];
  competencies: {
    id: string;
    label: string;
    categoryId: string | null;
  }[];
  supervisors: { id: string; label: string }[];
};

export type ExperienceLogListItem = {
  id: string;
  employerName: string;
  liftType: string;
  taskPerformed: string;
  hours: number;
  startDate: Date;
  endDate: Date;
  isApprenticeship: boolean;
  employee: { id: string; name: string };
  project: { id: string; code: string; name: string };
  supervisor: { id: string; name: string } | null;
  equipment: { id: string; name: string; assetTag: string } | null;
  category: { id: string; name: string } | null;
};

export type ExperienceTotals = {
  apprenticeshipHours: number;
  equipmentHours: number;
  projectHours: { projectId: string; projectName: string; hours: number }[];
  categoryHours: { categoryId: string; categoryName: string; hours: number }[];
  totalHours: number;
};

export type ExperienceMilestoneProgress = {
  id: string;
  name: string;
  description: string | null;
  kind: string;
  targetHours: number;
  completedHours: number;
  remainingHours: number;
  percentComplete: number;
  categoryName: string | null;
  competencyTitle: string | null;
};

export async function getExperienceEngineOptions(
  companyId: string,
): Promise<ServiceResult<ExperienceEngineOptions>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [company, employees, projects, equipment, categories, competencies] =
      await Promise.all([
        prisma.company.findFirst({
          where: { id: companyId, ...notDeleted },
          select: { name: true },
        }),
        prisma.employee.findMany({
          where: {
            companyId,
            ...notDeleted,
            status: { in: ["ACTIVE", "ON_LEAVE"] },
          },
          include: { user: true },
          orderBy: [
            { user: { lastName: "asc" } },
            { user: { firstName: "asc" } },
          ],
          take: 500,
        }),
        prisma.project.findMany({
          where: { companyId, ...notDeleted },
          orderBy: { name: "asc" },
          take: 200,
        }),
        prisma.equipment.findMany({
          where: { companyId, ...notDeleted },
          include: { equipmentType: true },
          orderBy: { name: "asc" },
          take: 200,
        }),
        prisma.competencyCategory.findMany({
          where: { companyId, ...notDeleted },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        prisma.competency.findMany({
          where: { companyId, status: "ACTIVE", ...notDeleted },
          select: { id: true, code: true, title: true, categoryId: true },
          orderBy: { title: "asc" },
          take: 500,
        }),
      ]);

    if (!company) return failure(new Error("Company not found."));

    return success({
      companyName: company.name,
      employees: employees.map((row) => ({
        id: row.id,
        label: fullName(row.user.firstName, row.user.lastName),
        supervisorId: row.supervisorId,
      })),
      projects: projects.map((row) => ({
        id: row.id,
        label: `${row.code} · ${row.name}`,
      })),
      equipment: equipment.map((row) => ({
        id: row.id,
        label: `${row.assetTag} · ${row.name}`,
        projectId: row.projectId,
      })),
      categories: categories.map((row) => ({
        id: row.id,
        label: row.name,
        parentId: row.parentId,
      })),
      competencies: competencies.map((row) => ({
        id: row.id,
        label: `${row.code} · ${row.title}`,
        categoryId: row.categoryId,
      })),
      supervisors: employees.map((row) => ({
        id: row.id,
        label: fullName(row.user.firstName, row.user.lastName),
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function ensureDefaultExperienceMilestones(
  companyId: string,
  createdById?: string | null,
) {
  const existing = await prisma.experienceMilestone.count({
    where: { companyId, ...notDeleted },
  });
  if (existing > 0) return;

  const categories = await prisma.competencyCategory.findMany({
    where: { companyId, parentId: null, ...notDeleted },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 8,
  });

  await prisma.experienceMilestone.createMany({
    data: [
      {
        companyId,
        kind: "APPRENTICESHIP",
        name: "Apprenticeship hours",
        description: "Total apprenticeship experience hours toward completion.",
        targetHours: 6000,
        sortOrder: 0,
        createdById: createdById ?? null,
      },
      {
        companyId,
        kind: "EQUIPMENT",
        name: "Equipment operating hours",
        description: "Hours logged against equipment assets.",
        targetHours: 500,
        sortOrder: 1,
        createdById: createdById ?? null,
      },
      ...categories.map((category, index) => ({
        companyId,
        kind: "CATEGORY" as const,
        name: `${category.name} experience`,
        description: `Hours toward ${category.name} competency category.`,
        targetHours: 250,
        categoryId: category.id,
        sortOrder: 10 + index,
        createdById: createdById ?? null,
      })),
    ],
  });
}

function buildListWhere(
  companyId: string,
  filters: Partial<ExperienceLogListFiltersInput> = {},
): Prisma.ExperienceLogEntryWhereInput {
  const and: Prisma.ExperienceLogEntryWhereInput[] = [
    { companyId },
    notDeleted,
  ];

  if (filters.employeeId) and.push({ employeeId: filters.employeeId });
  if (filters.projectId) and.push({ projectId: filters.projectId });
  if (filters.supervisorId) and.push({ supervisorId: filters.supervisorId });
  if (filters.equipmentId) and.push({ equipmentId: filters.equipmentId });
  if (filters.categoryId) and.push({ categoryId: filters.categoryId });
  if (filters.liftType) and.push({ liftType: filters.liftType });

  if (filters.from) {
    const from = parseDateOnly(filters.from);
    if (from) and.push({ endDate: { gte: from } });
  }
  if (filters.to) {
    const to = parseDateOnly(filters.to);
    if (to) and.push({ startDate: { lte: to } });
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { employerName: { contains: q, mode: "insensitive" } },
        { taskPerformed: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { project: { name: { contains: q, mode: "insensitive" } } },
        { project: { code: { contains: q, mode: "insensitive" } } },
        {
          employee: {
            user: {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  return { AND: and };
}

function mapListItem(entry: {
  id: string;
  employerName: string;
  liftType: string;
  taskPerformed: string;
  hours: Prisma.Decimal | number;
  startDate: Date;
  endDate: Date;
  isApprenticeship: boolean;
  employee: { id: string; user: { firstName: string; lastName: string } };
  project: { id: string; code: string; name: string };
  supervisor: {
    id: string;
    user: { firstName: string; lastName: string };
  } | null;
  equipment: { id: string; name: string; assetTag: string } | null;
  category: { id: string; name: string } | null;
}): ExperienceLogListItem {
  return {
    id: entry.id,
    employerName: entry.employerName,
    liftType: entry.liftType,
    taskPerformed: entry.taskPerformed,
    hours: toNumber(entry.hours),
    startDate: entry.startDate,
    endDate: entry.endDate,
    isApprenticeship: entry.isApprenticeship,
    employee: {
      id: entry.employee.id,
      name: fullName(entry.employee.user.firstName, entry.employee.user.lastName),
    },
    project: entry.project,
    supervisor: entry.supervisor
      ? {
          id: entry.supervisor.id,
          name: fullName(
            entry.supervisor.user.firstName,
            entry.supervisor.user.lastName,
          ),
        }
      : null,
    equipment: entry.equipment,
    category: entry.category,
  };
}

const listInclude = {
  employee: { include: { user: true } },
  project: true,
  supervisor: { include: { user: true } },
  equipment: true,
  category: true,
} as const;

export async function listExperienceLogs(
  companyId: string,
  filters: Partial<ExperienceLogListFiltersInput> & PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<ExperienceLogListItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(filters);
    const where = buildListWhere(companyId, filters);

    const [rows, total] = await Promise.all([
      prisma.experienceLogEntry.findMany({
        where,
        include: listInclude,
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.experienceLogEntry.count({ where }),
    ]);

    return success(
      toPaginatedResult(
        rows.map((row) => mapListItem(row)),
        total,
        page,
        pageSize,
      ),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function getExperienceLogById(
  companyId: string,
  entryId: string,
): Promise<ServiceResult<ExperienceLogListItem & { notes: string | null; competencyTitle: string | null }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const entry = await prisma.experienceLogEntry.findFirst({
      where: { id: entryId, companyId, ...notDeleted },
      include: {
        ...listInclude,
        competency: { select: { title: true, code: true } },
      },
    });
    if (!entry) return failure(new Error("Experience log entry not found."));

    return success({
      ...mapListItem(entry),
      notes: entry.notes,
      competencyTitle: entry.competency
        ? `${entry.competency.code} · ${entry.competency.title}`
        : null,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function createExperienceLogEntry(
  companyId: string,
  input: CreateExperienceLogInput,
  actor: { userId: string },
): Promise<ServiceResult<ExperienceLogListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const startDate = parseDateOnly(input.startDate);
    const endDate = parseDateOnly(input.endDate);
    if (!startDate || !endDate) {
      return failure(new Error("Enter a valid date range."));
    }

    const [employee, project, company] = await Promise.all([
      prisma.employee.findFirst({
        where: { id: input.employeeId, companyId, ...notDeleted },
      }),
      prisma.project.findFirst({
        where: { id: input.projectId, companyId, ...notDeleted },
      }),
      prisma.company.findFirst({
        where: { id: companyId, ...notDeleted },
        select: { name: true },
      }),
    ]);

    if (!employee || !project || !company) {
      return failure(new Error("Worker or project was not found."));
    }

    if (input.supervisorId) {
      const supervisor = await prisma.employee.findFirst({
        where: { id: input.supervisorId, companyId, ...notDeleted },
      });
      if (!supervisor) return failure(new Error("Supervisor was not found."));
    }

    if (input.equipmentId) {
      const equipment = await prisma.equipment.findFirst({
        where: { id: input.equipmentId, companyId, ...notDeleted },
      });
      if (!equipment) return failure(new Error("Equipment was not found."));
    }

    const created = await prisma.experienceLogEntry.create({
      data: {
        companyId,
        employeeId: input.employeeId,
        projectId: input.projectId,
        supervisorId: input.supervisorId ?? employee.supervisorId ?? null,
        equipmentId: input.equipmentId ?? null,
        categoryId: input.categoryId ?? null,
        competencyId: input.competencyId ?? null,
        employerName: input.employerName.trim() || company.name,
        liftType: input.liftType,
        taskPerformed: input.taskPerformed.trim(),
        hours: input.hours,
        startDate,
        endDate,
        isApprenticeship: input.isApprenticeship,
        notes: emptyToNull(input.notes),
        createdById: actor.userId,
      },
      include: listInclude,
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "ExperienceLogEntry",
        entityId: created.id,
        summary: `Logged ${input.hours}h experience for worker`,
        afterData: {
          employeeId: input.employeeId,
          projectId: input.projectId,
          hours: input.hours,
        },
      },
    });

    return success(mapListItem(created));
  } catch (error) {
    return failure(error);
  }
}

export async function getExperienceTotals(
  companyId: string,
  filters: { employeeId?: string } = {},
): Promise<ServiceResult<ExperienceTotals>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const where: Prisma.ExperienceLogEntryWhereInput = {
      companyId,
      ...notDeleted,
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    };

    const entries = await prisma.experienceLogEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
      },
    });

    let apprenticeshipHours = 0;
    let equipmentHours = 0;
    let totalHours = 0;
    const projectMap = new Map<string, { projectName: string; hours: number }>();
    const categoryMap = new Map<string, { categoryName: string; hours: number }>();

    for (const entry of entries) {
      const hours = toNumber(entry.hours);
      totalHours += hours;
      if (entry.isApprenticeship) apprenticeshipHours += hours;
      if (entry.equipmentId) equipmentHours += hours;

      const projectKey = entry.projectId;
      const projectExisting = projectMap.get(projectKey);
      projectMap.set(projectKey, {
        projectName: `${entry.project.code} · ${entry.project.name}`,
        hours: (projectExisting?.hours ?? 0) + hours,
      });

      if (entry.categoryId && entry.category) {
        const existing = categoryMap.get(entry.categoryId);
        categoryMap.set(entry.categoryId, {
          categoryName: entry.category.name,
          hours: (existing?.hours ?? 0) + hours,
        });
      }
    }

    return success({
      apprenticeshipHours,
      equipmentHours,
      totalHours,
      projectHours: [...projectMap.entries()]
        .map(([projectId, value]) => ({
          projectId,
          projectName: value.projectName,
          hours: value.hours,
        }))
        .sort((a, b) => b.hours - a.hours),
      categoryHours: [...categoryMap.entries()]
        .map(([categoryId, value]) => ({
          categoryId,
          categoryName: value.categoryName,
          hours: value.hours,
        }))
        .sort((a, b) => b.hours - a.hours),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function listExperienceMilestoneProgress(
  companyId: string,
  filters: { employeeId?: string } = {},
): Promise<ServiceResult<ExperienceMilestoneProgress[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    await ensureDefaultExperienceMilestones(companyId);

    const [milestones, totals] = await Promise.all([
      prisma.experienceMilestone.findMany({
        where: { companyId, isActive: true, ...notDeleted },
        include: {
          category: { select: { name: true } },
          competency: { select: { title: true, code: true } },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      getExperienceTotals(companyId, filters),
    ]);

    if (!totals.data) return { data: null, error: totals.error };

    const entryWhere: Prisma.ExperienceLogEntryWhereInput = {
      companyId,
      ...notDeleted,
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    };

    const competencyHours = await prisma.experienceLogEntry.groupBy({
      by: ["competencyId"],
      where: { ...entryWhere, competencyId: { not: null } },
      _sum: { hours: true },
    });
    const competencyMap = new Map(
      competencyHours.map((row) => [
        row.competencyId!,
        toNumber(row._sum.hours ?? 0),
      ]),
    );

    const progress: ExperienceMilestoneProgress[] = milestones.map(
      (milestone) => {
        const target = toNumber(milestone.targetHours);
        let completed = 0;

        if (milestone.kind === "APPRENTICESHIP") {
          completed = totals.data!.apprenticeshipHours;
        } else if (milestone.kind === "EQUIPMENT") {
          completed = totals.data!.equipmentHours;
        } else if (milestone.kind === "CATEGORY" && milestone.categoryId) {
          completed =
            totals.data!.categoryHours.find(
              (item) => item.categoryId === milestone.categoryId,
            )?.hours ?? 0;
        } else if (milestone.kind === "PROJECT") {
          completed = totals.data!.totalHours;
        } else if (milestone.competencyId) {
          completed = competencyMap.get(milestone.competencyId) ?? 0;
        } else {
          completed = totals.data!.totalHours;
        }

        const percentComplete =
          target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;

        return {
          id: milestone.id,
          name: milestone.name,
          description: milestone.description,
          kind: milestone.kind,
          targetHours: target,
          completedHours: completed,
          remainingHours: Math.max(0, target - completed),
          percentComplete,
          categoryName: milestone.category?.name ?? null,
          competencyTitle: milestone.competency
            ? `${milestone.competency.code} · ${milestone.competency.title}`
            : null,
        };
      },
    );

    return success(progress);
  } catch (error) {
    return failure(error);
  }
}

export async function createExperienceMilestone(
  companyId: string,
  input: CreateExperienceMilestoneInput,
  actorUserId: string,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const created = await prisma.experienceMilestone.create({
      data: {
        companyId,
        name: input.name.trim(),
        description: emptyToNull(input.description),
        kind: input.kind,
        targetHours: input.targetHours,
        categoryId: input.categoryId ?? null,
        competencyId: input.competencyId ?? null,
        sortOrder: input.sortOrder ?? 0,
        createdById: actorUserId,
      },
      select: { id: true },
    });
    return success(created);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteExperienceLog(
  companyId: string,
  entryId: string,
  actorUserId: string,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.experienceLogEntry.findFirst({
      where: { id: entryId, companyId, ...notDeleted },
    });
    if (!existing) return failure(new Error("Experience log entry not found."));

    await prisma.experienceLogEntry.update({
      where: { id: entryId },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId,
        action: "DELETE",
        entityType: "ExperienceLogEntry",
        entityId: entryId,
        summary: "Soft-deleted experience log entry",
      },
    });

    return success({ id: entryId });
  } catch (error) {
    return failure(error);
  }
}
