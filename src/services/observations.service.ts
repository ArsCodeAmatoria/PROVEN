import "server-only";

import type {
  Competency,
  CompetencyCategory,
  Employee,
  Observation,
  ObservationFollowUpStatus,
  ObservationType,
  Photo,
  Project,
  User,
  Video,
} from "@/generated/prisma/client";
import type {
  CreateObservationInput,
  UpdateObservationFollowUpInput,
} from "@/lib/validations/observation";
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

type EmployeeUser = Employee & { user: User };

export type ObservationListItem = Observation & {
  employee: EmployeeUser;
  observer: EmployeeUser;
  project: Project | null;
  category: CompetencyCategory | null;
  competency: Competency | null;
};

export type ObservationDetail = ObservationListItem & {
  photos: Photo[];
  videos: Video[];
};

export type ObservationEngineOptions = {
  employees: { id: string; label: string }[];
  projects: { id: string; label: string }[];
  categories: { id: string; label: string; parentId: string | null }[];
  competencies: {
    id: string;
    label: string;
    categoryId: string | null;
    code: string;
  }[];
};

export type ObservationListFilters = PaginationParams & {
  q?: string;
  employeeId?: string;
  projectId?: string;
  observationType?: ObservationType;
  followUpStatus?: ObservationFollowUpStatus;
};

function emptyToNull(value?: string | null) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseObservedAt(date: string, time: string) {
  const value = new Date(`${date}T${time}`);
  if (Number.isNaN(value.getTime())) {
    return null;
  }
  return value;
}

function parseDueDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function defaultFollowUpStatus(
  observationType: ObservationType,
  requested: ObservationFollowUpStatus,
): ObservationFollowUpStatus {
  if (requested !== "NONE") return requested;
  if (
    observationType === "FOLLOW_UP_REQUIRED" ||
    observationType === "UNSAFE_ACT" ||
    observationType === "UNSAFE_CONDITION" ||
    observationType === "NEAR_MISS" ||
    observationType === "COACHING_OPPORTUNITY"
  ) {
    return "OPEN";
  }
  return "NONE";
}

export async function getObservationEngineOptions(
  companyId: string,
): Promise<ServiceResult<ObservationEngineOptions>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [employees, projects, categories, competencies] = await Promise.all([
      prisma.employee.findMany({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["ACTIVE", "ON_LEAVE"] },
          user: { ...notDeleted, isActive: true },
        },
        include: { user: true },
        orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
      }),
      prisma.project.findMany({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["PLANNED", "ACTIVE", "ON_HOLD"] },
        },
        orderBy: { name: "asc" },
      }),
      prisma.competencyCategory.findMany({
        where: { companyId, ...notDeleted },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      prisma.competency.findMany({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["ACTIVE", "DRAFT"] },
        },
        orderBy: { title: "asc" },
      }),
    ]);

    return success({
      employees: employees.map((employee) => ({
        id: employee.id,
        label: fullName(employee.user.firstName, employee.user.lastName),
      })),
      projects: projects.map((project) => ({
        id: project.id,
        label: `${project.code} · ${project.name}`,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        label: category.name,
        parentId: category.parentId,
      })),
      competencies: competencies.map((competency) => ({
        id: competency.id,
        label: competency.title,
        categoryId: competency.categoryId,
        code: competency.code,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function listObservations(
  companyId: string,
  filters: ObservationListFilters = {},
): Promise<ServiceResult<PaginatedResult<ObservationListItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(filters);
    const q = filters.q?.trim();

    const where = {
      companyId,
      ...notDeleted,
      ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.observationType
        ? { observationType: filters.observationType }
        : {}),
      ...(filters.followUpStatus
        ? { followUpStatus: filters.followUpStatus }
        : {}),
      ...(q
        ? {
            OR: [
              { context: { contains: q, mode: "insensitive" as const } },
              { location: { contains: q, mode: "insensitive" as const } },
              { comments: { contains: q, mode: "insensitive" as const } },
              {
                employee: {
                  user: {
                    OR: [
                      {
                        firstName: { contains: q, mode: "insensitive" as const },
                      },
                      {
                        lastName: { contains: q, mode: "insensitive" as const },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.observation.findMany({
        where,
        include: {
          employee: { include: { user: true } },
          observer: { include: { user: true } },
          project: true,
          category: true,
          competency: true,
        },
        orderBy: { observedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.observation.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function getObservationById(
  companyId: string,
  observationId: string,
): Promise<ServiceResult<ObservationDetail>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const observation = await prisma.observation.findFirst({
      where: { id: observationId, companyId, ...notDeleted },
      include: {
        employee: { include: { user: true } },
        observer: { include: { user: true } },
        project: true,
        category: true,
        competency: true,
      },
    });

    if (!observation) {
      return { data: null, error: "Observation not found." };
    }

    const [photos, videos] = await Promise.all([
      prisma.photo.findMany({
        where: {
          companyId,
          entityType: "OBSERVATION",
          entityId: observationId,
          ...notDeleted,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.video.findMany({
        where: {
          companyId,
          entityType: "OBSERVATION",
          entityId: observationId,
          ...notDeleted,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return success({ ...observation, photos, videos });
  } catch (error) {
    return failure(error);
  }
}

export async function createFieldObservation(
  companyId: string,
  input: CreateObservationInput,
  actor: { userId: string; employeeId: string | null },
): Promise<ServiceResult<ObservationListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    if (!actor.employeeId) {
      return {
        data: null,
        error: "Your account needs an employee record to record observations.",
      };
    }

    const observedAt = parseObservedAt(input.observedDate, input.observedTime);
    if (!observedAt) {
      return { data: null, error: "Enter a valid observation date and time." };
    }

    const [employee, project, observer] = await Promise.all([
      prisma.employee.findFirst({
        where: { id: input.employeeId, companyId, ...notDeleted },
      }),
      prisma.project.findFirst({
        where: { id: input.projectId, companyId, ...notDeleted },
      }),
      prisma.employee.findFirst({
        where: { id: actor.employeeId, companyId, ...notDeleted },
      }),
    ]);

    if (!employee) return { data: null, error: "Worker not found." };
    if (!project) return { data: null, error: "Project not found." };
    if (!observer) return { data: null, error: "Observer not found." };

    if (input.categoryId) {
      const category = await prisma.competencyCategory.findFirst({
        where: { id: input.categoryId, companyId, ...notDeleted },
      });
      if (!category) return { data: null, error: "Category not found." };
    }

    if (input.competencyId) {
      const competency = await prisma.competency.findFirst({
        where: { id: input.competencyId, companyId, ...notDeleted },
      });
      if (!competency) return { data: null, error: "Competency not found." };
    }

    const comments = emptyToNull(input.comments) ?? null;
    const followUpStatus = defaultFollowUpStatus(
      input.observationType,
      input.followUpStatus,
    );

    const observation = await prisma.observation.create({
      data: {
        companyId,
        employeeId: input.employeeId,
        projectId: input.projectId,
        categoryId: input.categoryId || null,
        competencyId: input.competencyId || null,
        observerId: actor.employeeId,
        observationType: input.observationType,
        context: input.context.trim(),
        location: emptyToNull(input.location) ?? null,
        comments,
        notes: comments || input.context.trim(),
        correctiveActions: emptyToNull(input.correctiveActions) ?? null,
        dueDate: parseDueDate(input.dueDate),
        followUpStatus,
        observedAt,
        createdById: actor.userId,
      },
      include: {
        employee: { include: { user: true } },
        observer: { include: { user: true } },
        project: true,
        category: true,
        competency: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "Observation",
        entityId: observation.id,
        summary: `Recorded field observation: ${observation.context}`,
        afterData: {
          employeeId: observation.employeeId,
          observationType: observation.observationType,
          projectId: observation.projectId,
          followUpStatus: observation.followUpStatus,
        },
      },
    });

    return success(observation);
  } catch (error) {
    return failure(error);
  }
}

export async function updateObservationFollowUp(
  companyId: string,
  observationId: string,
  input: UpdateObservationFollowUpInput,
  actorUserId?: string | null,
): Promise<ServiceResult<ObservationListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.observation.findFirst({
      where: { id: observationId, companyId, ...notDeleted },
    });
    if (!existing) {
      return { data: null, error: "Observation not found." };
    }

    const observation = await prisma.observation.update({
      where: { id: observationId },
      data: {
        comments: emptyToNull(input.comments) ?? null,
        notes: emptyToNull(input.comments) ?? existing.notes,
        correctiveActions: emptyToNull(input.correctiveActions) ?? null,
        dueDate: parseDueDate(input.dueDate),
        followUpStatus: input.followUpStatus,
      },
      include: {
        employee: { include: { user: true } },
        observer: { include: { user: true } },
        project: true,
        category: true,
        competency: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "UPDATE",
        entityType: "Observation",
        entityId: observationId,
        summary: `Updated observation follow-up to ${input.followUpStatus}`,
        beforeData: {
          followUpStatus: existing.followUpStatus,
          dueDate: existing.dueDate,
        },
        afterData: {
          followUpStatus: observation.followUpStatus,
          dueDate: observation.dueDate,
        },
      },
    });

    return success(observation);
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteObservation(
  companyId: string,
  observationId: string,
  actorUserId?: string | null,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.observation.findFirst({
      where: { id: observationId, companyId, ...notDeleted },
    });
    if (!existing) {
      return { data: null, error: "Observation not found." };
    }

    await prisma.observation.update({
      where: { id: observationId },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "DELETE",
        entityType: "Observation",
        entityId: observationId,
        summary: `Soft-deleted observation ${existing.context}`,
      },
    });

    return success({ id: observationId });
  } catch (error) {
    return failure(error);
  }
}

export async function addObservationPhoto(
  companyId: string,
  observationId: string,
  data: {
    storagePath: string;
    url: string;
    caption?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    uploadedById?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<Photo>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const observation = await prisma.observation.findFirst({
      where: { id: observationId, companyId, ...notDeleted },
    });
    if (!observation) {
      return { data: null, error: "Observation not found." };
    }

    const photo = await prisma.photo.create({
      data: {
        companyId,
        entityType: "OBSERVATION",
        entityId: observationId,
        storagePath: data.storagePath,
        url: data.url,
        caption: data.caption ?? null,
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
        entityType: "Photo",
        entityId: photo.id,
        summary: "Added observation photo",
      },
    });

    return success(photo);
  } catch (error) {
    return failure(error);
  }
}

export async function addObservationVideo(
  companyId: string,
  observationId: string,
  data: {
    storagePath: string;
    url: string;
    caption?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
    uploadedById?: string | null;
    createdById?: string | null;
  },
): Promise<ServiceResult<Video>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const observation = await prisma.observation.findFirst({
      where: { id: observationId, companyId, ...notDeleted },
    });
    if (!observation) {
      return { data: null, error: "Observation not found." };
    }

    const video = await prisma.video.create({
      data: {
        companyId,
        entityType: "OBSERVATION",
        entityId: observationId,
        storagePath: data.storagePath,
        url: data.url,
        caption: data.caption ?? null,
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
        entityType: "Video",
        entityId: video.id,
        summary: "Added observation video",
      },
    });

    return success(video);
  } catch (error) {
    return failure(error);
  }
}
