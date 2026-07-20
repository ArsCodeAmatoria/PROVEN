import "server-only";

import type {
  Assessment,
  AssessmentRating,
  AssessmentResult,
  AssessmentSignature,
  Competency,
  CompetencyCategory,
  Employee,
  Photo,
  Project,
  User,
  Video,
} from "@/generated/prisma/client";
import type { CreateAssessmentEngineInput } from "@/lib/validations/assessment";
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
import { matrixStatusFromAssessment } from "@/lib/training-matrix-status";

const RATING_SCORES: Record<AssessmentRating, number> = {
  NOT_OBSERVED: 0,
  NEEDS_IMPROVEMENT: 1,
  PASS: 2,
  COMPETENT: 3,
  EXCEEDS_STANDARD: 4,
};

type EmployeeUser = Employee & { user: User };

export type AssessmentListItem = Assessment & {
  project: Project | null;
  competency: (Competency & { category: CompetencyCategory | null }) | null;
  assessor: EmployeeUser | null;
  result: (AssessmentResult & {
    employee: EmployeeUser;
  }) | null;
};

export type AssessmentDetail = Assessment & {
  project: Project | null;
  competency: (Competency & { category: CompetencyCategory | null }) | null;
  assessor: EmployeeUser | null;
  result: (AssessmentResult & {
    employee: EmployeeUser;
    assessor: EmployeeUser | null;
    signatures: AssessmentSignature[];
  }) | null;
  photos: Photo[];
  videos: Video[];
  history: CompetencyAssessmentHistoryItem[];
  trends: CompetencyTrendPoint[];
};

export type CompetencyAssessmentHistoryItem = {
  id: string;
  assessmentId: string;
  assessedAt: Date;
  rating: AssessmentRating | null;
  title: string;
  projectName: string | null;
  assessorName: string | null;
};

export type CompetencyTrendPoint = {
  label: string;
  value: number;
  rating: AssessmentRating | null;
  assessedAt: Date;
};

export type AssessmentEngineOptions = {
  employees: { id: string; label: string }[];
  projects: { id: string; label: string; employeeId?: string | null }[];
  categories: { id: string; label: string; parentId: string | null }[];
  competencies: {
    id: string;
    label: string;
    categoryId: string | null;
    code: string;
  }[];
};

export type AssessmentListFilters = PaginationParams & {
  q?: string;
  employeeId?: string;
  competencyId?: string;
  projectId?: string;
  rating?: AssessmentRating;
};

function ratingToOutcome(rating: AssessmentRating) {
  switch (rating) {
    case "EXCEEDS_STANDARD":
    case "COMPETENT":
    case "PASS":
      return "COMPETENT" as const;
    case "NEEDS_IMPROVEMENT":
      return "NOT_YET_COMPETENT" as const;
    case "NOT_OBSERVED":
      return "REQUIRES_REVIEW" as const;
  }
}

function emptyToNull(value?: string | null) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function getAssessmentEngineOptions(
  companyId: string,
): Promise<ServiceResult<AssessmentEngineOptions>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [employees, projects, categories, competencies, assignments] =
      await Promise.all([
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
          orderBy: [{ name: "asc" }],
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
          orderBy: [{ title: "asc" }],
        }),
        prisma.projectAssignment.findMany({
          where: { ...notDeleted, project: { companyId, ...notDeleted } },
          select: { projectId: true, employeeId: true },
        }),
      ]);

    const assignmentByProject = new Map<string, string[]>();
    for (const assignment of assignments) {
      const list = assignmentByProject.get(assignment.projectId) ?? [];
      list.push(assignment.employeeId);
      assignmentByProject.set(assignment.projectId, list);
    }

    return success({
      employees: employees.map((employee) => ({
        id: employee.id,
        label: fullName(employee.user.firstName, employee.user.lastName),
      })),
      projects: projects.flatMap((project) => {
        const assigned = assignmentByProject.get(project.id);
        const base = {
          id: project.id,
          label: `${project.code} · ${project.name}`,
        };
        if (!assigned?.length) {
          return [{ ...base, employeeId: null as string | null }];
        }
        return assigned.map((employeeId) => ({
          ...base,
          employeeId: employeeId as string | null,
        }));
      }),
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

export async function listAssessments(
  companyId: string,
  filters: AssessmentListFilters = {},
): Promise<ServiceResult<PaginatedResult<AssessmentListItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(filters);
    const q = filters.q?.trim();

    const where = {
      companyId,
      ...notDeleted,
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.competencyId ? { competencyId: filters.competencyId } : {}),
      ...(filters.employeeId || filters.rating || q
        ? {
            results: {
              some: {
                ...notDeleted,
                ...(filters.employeeId
                  ? { employeeId: filters.employeeId }
                  : {}),
                ...(filters.rating ? { rating: filters.rating } : {}),
                ...(q
                  ? {
                      OR: [
                        {
                          employee: {
                            user: {
                              OR: [
                                {
                                  firstName: {
                                    contains: q,
                                    mode: "insensitive" as const,
                                  },
                                },
                                {
                                  lastName: {
                                    contains: q,
                                    mode: "insensitive" as const,
                                  },
                                },
                              ],
                            },
                          },
                        },
                      ],
                    }
                  : {}),
              },
            },
          }
        : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              {
                competency: {
                  title: { contains: q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        include: {
          project: true,
          competency: { include: { category: true } },
          assessor: { include: { user: true } },
          results: {
            where: notDeleted,
            include: { employee: { include: { user: true } } },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.assessment.count({ where }),
    ]);

    const items: AssessmentListItem[] = rows.map((row) => {
      const { results, ...assessment } = row;
      return {
        ...assessment,
        result: results[0] ?? null,
      };
    });

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

/** @deprecated Use listAssessments */
export async function listContinuousAssessments(
  companyId: string,
  params: PaginationParams = {},
) {
  return listAssessments(companyId, params);
}

export async function getAssessmentById(
  companyId: string,
  assessmentId: string,
): Promise<ServiceResult<AssessmentDetail>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, companyId, ...notDeleted },
      include: {
        project: true,
        competency: { include: { category: true } },
        assessor: { include: { user: true } },
        results: {
          where: notDeleted,
          include: {
            employee: { include: { user: true } },
            assessor: { include: { user: true } },
            signatures: {
              where: notDeleted,
              orderBy: { signedAt: "asc" },
            },
          },
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!assessment) {
      return { data: null, error: "Assessment not found." };
    }

    const result = assessment.results[0] ?? null;
    const mediaEntityIds = [
      assessment.id,
      ...(result ? [result.id] : []),
    ];

    const [photos, videos, history] = await Promise.all([
      prisma.photo.findMany({
        where: {
          companyId,
          entityType: { in: ["ASSESSMENT", "ASSESSMENT_RESULT"] },
          entityId: { in: mediaEntityIds },
          ...notDeleted,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.video.findMany({
        where: {
          companyId,
          entityType: { in: ["ASSESSMENT", "ASSESSMENT_RESULT"] },
          entityId: { in: mediaEntityIds },
          ...notDeleted,
        },
        orderBy: { createdAt: "desc" },
      }),
      result && assessment.competencyId
        ? prisma.assessmentResult.findMany({
            where: {
              ...notDeleted,
              employeeId: result.employeeId,
              lockedAt: { not: null },
              assessment: {
                companyId,
                competencyId: assessment.competencyId,
                ...notDeleted,
              },
            },
            include: {
              assessment: {
                include: {
                  project: true,
                  assessor: { include: { user: true } },
                },
              },
            },
            orderBy: { assessedAt: "asc" },
            take: 50,
          })
        : Promise.resolve([]),
    ]);

    const historyItems: CompetencyAssessmentHistoryItem[] = history.map(
      (item) => ({
        id: item.id,
        assessmentId: item.assessmentId,
        assessedAt: item.assessedAt ?? item.createdAt,
        rating: item.rating,
        title: item.assessment.title,
        projectName: item.assessment.project?.name ?? null,
        assessorName: item.assessment.assessor
          ? fullName(
              item.assessment.assessor.user.firstName,
              item.assessment.assessor.user.lastName,
            )
          : null,
      }),
    );

    const trends: CompetencyTrendPoint[] = historyItems.map((item) => ({
      label: item.assessedAt.toISOString().slice(0, 10),
      value: item.rating ? RATING_SCORES[item.rating] : 0,
      rating: item.rating,
      assessedAt: item.assessedAt,
    }));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit relation payload
    const { results, ...rest } = assessment;

    return success({
      ...rest,
      result,
      photos,
      videos,
      history: historyItems,
      trends,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function createPermanentAssessment(
  companyId: string,
  input: CreateAssessmentEngineInput,
  actor: {
    userId: string;
    employeeId: string | null;
  },
): Promise<ServiceResult<AssessmentListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [employee, project, competency] = await Promise.all([
      prisma.employee.findFirst({
        where: { id: input.employeeId, companyId, ...notDeleted },
        include: { user: true },
      }),
      prisma.project.findFirst({
        where: { id: input.projectId, companyId, ...notDeleted },
      }),
      prisma.competency.findFirst({
        where: { id: input.competencyId, companyId, ...notDeleted },
        include: { category: true },
      }),
    ]);

    if (!employee) return { data: null, error: "Employee not found." };
    if (!project) return { data: null, error: "Project not found." };
    if (!competency) return { data: null, error: "Competency not found." };

    if (
      input.categoryId &&
      competency.categoryId &&
      competency.categoryId !== input.categoryId &&
      competency.category?.parentId !== input.categoryId
    ) {
      return {
        data: null,
        error: "Selected competency does not belong to that category.",
      };
    }

    const now = new Date();
    const employeeName = fullName(employee.user.firstName, employee.user.lastName);
    const title =
      input.title?.trim() ||
      `${competency.title} — ${employeeName} (${now.toISOString().slice(0, 10)})`;

    const assessment = await prisma.assessment.create({
      data: {
        companyId,
        projectId: project.id,
        competencyId: competency.id,
        assessorId: actor.employeeId,
        type: input.type ?? "PRACTICAL",
        title,
        description: `Permanent competency assessment for ${employeeName}`,
        status: "COMPLETED",
        scheduledAt: now,
        completedAt: now,
        createdById: actor.userId,
        results: {
          create: {
            employeeId: employee.id,
            assessorId: actor.employeeId,
            rating: input.rating,
            outcome: ratingToOutcome(input.rating),
            comments: emptyToNull(input.comments) ?? null,
            instructorNotes: emptyToNull(input.instructorNotes) ?? null,
            apprenticeComments: emptyToNull(input.apprenticeComments) ?? null,
            assessedAt: now,
            lockedAt: now,
            createdById: actor.userId,
            signatures: {
              create: [
                {
                  role: "INSTRUCTOR",
                  signerName: input.instructorSignatureName.trim(),
                  signerEmployeeId: actor.employeeId,
                  signedAt: now,
                  createdById: actor.userId,
                },
                ...(input.apprenticeSignatureName?.trim()
                  ? [
                      {
                        role: "APPRENTICE" as const,
                        signerName: input.apprenticeSignatureName.trim(),
                        signerEmployeeId: employee.id,
                        signedAt: now,
                        createdById: actor.userId,
                      },
                    ]
                  : []),
              ],
            },
          },
        },
      },
      include: {
        project: true,
        competency: { include: { category: true } },
        assessor: { include: { user: true } },
        results: {
          include: { employee: { include: { user: true } } },
          take: 1,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "Assessment",
        entityId: assessment.id,
        summary: `Recorded permanent assessment ${title}`,
        afterData: {
          employeeId: employee.id,
          competencyId: competency.id,
          projectId: project.id,
          rating: input.rating,
          locked: true,
        },
      },
    });

    // Update training matrix if an entry exists — never overwrite historical assessments.
    const matrixStatus = matrixStatusFromAssessment({
      rating: input.rating,
      hasInstructorSignature: true,
      hasApprenticeSignature: Boolean(input.apprenticeSignatureName?.trim()),
    });

    await prisma.trainingMatrixEntry.updateMany({
      where: {
        employeeId: employee.id,
        competencyId: competency.id,
        ...notDeleted,
      },
      data: {
        status: matrixStatus,
        lastAssessedAt: now,
      },
    });

    const { results, ...rest } = assessment;
    return success({
      ...rest,
      result: results[0] ?? null,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function addAssessmentPhoto(
  companyId: string,
  assessmentResultId: string,
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
    const result = await prisma.assessmentResult.findFirst({
      where: {
        id: assessmentResultId,
        ...notDeleted,
        assessment: { companyId, ...notDeleted },
      },
    });
    if (!result) return { data: null, error: "Assessment result not found." };
    if (result.lockedAt) {
      // Media can still be appended as evidence without mutating the locked result.
    }

    const photo = await prisma.photo.create({
      data: {
        companyId,
        entityType: "ASSESSMENT_RESULT",
        entityId: assessmentResultId,
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
        summary: "Added assessment photo evidence",
      },
    });

    return success(photo);
  } catch (error) {
    return failure(error);
  }
}

export async function addAssessmentVideo(
  companyId: string,
  assessmentResultId: string,
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
    const result = await prisma.assessmentResult.findFirst({
      where: {
        id: assessmentResultId,
        ...notDeleted,
        assessment: { companyId, ...notDeleted },
      },
    });
    if (!result) return { data: null, error: "Assessment result not found." };

    const video = await prisma.video.create({
      data: {
        companyId,
        entityType: "ASSESSMENT_RESULT",
        entityId: assessmentResultId,
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
        summary: "Added assessment video evidence",
      },
    });

    return success(video);
  } catch (error) {
    return failure(error);
  }
}

export async function addAssessmentSignatureImage(
  companyId: string,
  signatureId: string,
  data: {
    storagePath: string;
    signatureUrl: string;
  },
): Promise<ServiceResult<AssessmentSignature>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.assessmentSignature.findFirst({
      where: {
        id: signatureId,
        ...notDeleted,
        assessmentResult: {
          assessment: { companyId, ...notDeleted },
        },
      },
    });
    if (!existing) return { data: null, error: "Signature not found." };

    // Never overwrite: if an image already exists, append a new signature row.
    if (existing.signatureUrl) {
      const created = await prisma.assessmentSignature.create({
        data: {
          assessmentResultId: existing.assessmentResultId,
          signerEmployeeId: existing.signerEmployeeId,
          role: existing.role,
          signerName: existing.signerName,
          storagePath: data.storagePath,
          signatureUrl: data.signatureUrl,
          createdById: existing.createdById,
        },
      });
      return success(created);
    }

    const updated = await prisma.assessmentSignature.update({
      where: { id: signatureId },
      data: {
        storagePath: data.storagePath,
        signatureUrl: data.signatureUrl,
      },
    });
    return success(updated);
  } catch (error) {
    return failure(error);
  }
}
