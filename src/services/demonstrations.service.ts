import "server-only";

import type { AssessmentRating } from "@/generated/prisma/client";
import type { CreateDemonstrationInput } from "@/lib/validations/demonstration";
import { prisma } from "@/lib/prisma";
import type { PaginatedResult, ServiceResult } from "@/types";
import { notDeleted } from "@/types";

import {
  createPermanentAssessment,
  getAssessmentById,
  getAssessmentEngineOptions,
  type AssessmentDetail,
  type AssessmentEngineOptions,
  type AssessmentListFilters,
  type AssessmentListItem,
  type CompetencyTrendPoint,
} from "./assessments.service";
import {
  failure,
  getDatabaseConfigError,
  normalizePagination,
  success,
  toPaginatedResult,
  unavailable,
} from "./base";

export type DemonstrationListItem = AssessmentListItem;
export type DemonstrationDetail = AssessmentDetail & {
  progression: DemonstrationProgression;
};

export type DemonstrationProgression = {
  competencyId: string | null;
  competencyTitle: string | null;
  requiredCount: number | null;
  successfulCount: number;
  totalCount: number;
  remainingCount: number | null;
  isComplete: boolean;
  trends: CompetencyTrendPoint[];
};

export type DemonstrationListFilters = AssessmentListFilters;

const SUCCESSFUL_RATINGS = new Set<AssessmentRating>([
  "COMPETENT",
  "EXCEEDS_STANDARD",
  "PASS",
]);

const RATING_SCORES: Partial<Record<AssessmentRating, number>> = {
  NOT_OBSERVED: 0,
  NEEDS_IMPROVEMENT: 1,
  COMPETENT: 2,
  EXCEEDS_STANDARD: 3,
  PASS: 2,
};

function isSuccessful(rating: AssessmentRating | null | undefined) {
  return Boolean(rating && SUCCESSFUL_RATINGS.has(rating));
}

export async function getDemonstrationEngineOptions(companyId: string) {
  return getAssessmentEngineOptions(companyId);
}

export async function listDemonstrations(
  companyId: string,
  filters: DemonstrationListFilters = {},
): Promise<ServiceResult<PaginatedResult<DemonstrationListItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(filters);
    const q = filters.q?.trim();

    const where = {
      companyId,
      type: "PRACTICAL" as const,
      ...notDeleted,
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.competencyId ? { competencyId: filters.competencyId } : {}),
      ...(filters.employeeId || filters.rating
        ? {
            results: {
              some: {
                ...notDeleted,
                ...(filters.employeeId
                  ? { employeeId: filters.employeeId }
                  : {}),
                ...(filters.rating ? { rating: filters.rating } : {}),
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

    const items: DemonstrationListItem[] = rows.map((row) => {
      const { results, ...assessment } = row;
      return { ...assessment, result: results[0] ?? null };
    });

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function getDemonstrationProgression(
  companyId: string,
  employeeId: string,
  competencyId: string,
): Promise<ServiceResult<DemonstrationProgression>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const competency = await prisma.competency.findFirst({
      where: { id: competencyId, companyId, ...notDeleted },
    });
    if (!competency) {
      return { data: null, error: "Competency not found." };
    }

    const results = await prisma.assessmentResult.findMany({
      where: {
        ...notDeleted,
        employeeId,
        lockedAt: { not: null },
        assessment: {
          companyId,
          competencyId,
          type: "PRACTICAL",
          ...notDeleted,
        },
      },
      orderBy: { assessedAt: "asc" },
    });

    const successfulCount = results.filter((item) =>
      isSuccessful(item.rating),
    ).length;
    const requiredCount = competency.requiredDemonstrationCount;
    const remainingCount =
      requiredCount == null
        ? null
        : Math.max(0, requiredCount - successfulCount);

    const trends: CompetencyTrendPoint[] = results.map((item) => ({
      label: (item.assessedAt ?? item.createdAt).toISOString().slice(0, 10),
      value: item.rating ? (RATING_SCORES[item.rating] ?? 0) : 0,
      rating: item.rating,
      assessedAt: item.assessedAt ?? item.createdAt,
    }));

    return success({
      competencyId: competency.id,
      competencyTitle: competency.title,
      requiredCount,
      successfulCount,
      totalCount: results.length,
      remainingCount,
      isComplete:
        requiredCount != null ? successfulCount >= requiredCount : false,
      trends,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function getDemonstrationById(
  companyId: string,
  assessmentId: string,
): Promise<ServiceResult<DemonstrationDetail>> {
  const detail = await getAssessmentById(companyId, assessmentId);
  if (detail.error || !detail.data) {
    return { data: null, error: detail.error };
  }

  if (detail.data.type !== "PRACTICAL") {
    return { data: null, error: "Practical demonstration not found." };
  }

  const employeeId = detail.data.result?.employeeId;
  const competencyId = detail.data.competencyId;

  let progression: DemonstrationProgression = {
    competencyId,
    competencyTitle: detail.data.competency?.title ?? null,
    requiredCount: detail.data.competency?.requiredDemonstrationCount ?? null,
    successfulCount: 0,
    totalCount: 0,
    remainingCount: null,
    isComplete: false,
    trends: detail.data.trends.map((point) => ({
      ...point,
      value: point.rating ? (RATING_SCORES[point.rating] ?? point.value) : 0,
    })),
  };

  if (employeeId && competencyId) {
    const progress = await getDemonstrationProgression(
      companyId,
      employeeId,
      competencyId,
    );
    if (progress.data) {
      progression = progress.data;
    }
  }

  return success({
    ...detail.data,
    progression,
  });
}

export async function createPracticalDemonstration(
  companyId: string,
  input: CreateDemonstrationInput,
  actor: { userId: string; employeeId: string | null },
) {
  return createPermanentAssessment(
    companyId,
    {
      employeeId: input.employeeId,
      projectId: input.projectId,
      categoryId: input.categoryId,
      competencyId: input.competencyId,
      type: "PRACTICAL",
      title: input.title,
      rating: input.rating,
      comments: input.comments,
      instructorNotes: input.instructorNotes,
      apprenticeComments: input.workerComments,
      instructorSignatureName: input.instructorSignatureName,
      apprenticeSignatureName: input.workerSignatureName,
    },
    actor,
  );
}

export async function listWorkerDemonstrationProgress(
  companyId: string,
  employeeId: string,
): Promise<
  ServiceResult<
    {
      competencyId: string;
      competencyTitle: string;
      competencyCode: string;
      requiredCount: number | null;
      successfulCount: number;
      totalCount: number;
      remainingCount: number | null;
      isComplete: boolean;
      latestRating: AssessmentRating | null;
      latestAssessedAt: Date | null;
    }[]
  >
> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const results = await prisma.assessmentResult.findMany({
      where: {
        ...notDeleted,
        employeeId,
        lockedAt: { not: null },
        assessment: {
          companyId,
          type: "PRACTICAL",
          competencyId: { not: null },
          ...notDeleted,
        },
      },
      include: {
        assessment: {
          include: {
            competency: true,
          },
        },
      },
      orderBy: { assessedAt: "desc" },
    });

    const byCompetency = new Map<
      string,
      {
        competencyId: string;
        competencyTitle: string;
        competencyCode: string;
        requiredCount: number | null;
        successfulCount: number;
        totalCount: number;
        latestRating: AssessmentRating | null;
        latestAssessedAt: Date | null;
      }
    >();

    for (const result of results) {
      const competency = result.assessment.competency;
      if (!competency) continue;
      const existing = byCompetency.get(competency.id) ?? {
        competencyId: competency.id,
        competencyTitle: competency.title,
        competencyCode: competency.code,
        requiredCount: competency.requiredDemonstrationCount,
        successfulCount: 0,
        totalCount: 0,
        latestRating: null as AssessmentRating | null,
        latestAssessedAt: null as Date | null,
      };

      existing.totalCount += 1;
      if (isSuccessful(result.rating)) existing.successfulCount += 1;
      if (!existing.latestAssessedAt) {
        existing.latestRating = result.rating;
        existing.latestAssessedAt = result.assessedAt ?? result.createdAt;
      }

      byCompetency.set(competency.id, existing);
    }

    return success(
      Array.from(byCompetency.values()).map((item) => ({
        ...item,
        remainingCount:
          item.requiredCount == null
            ? null
            : Math.max(0, item.requiredCount - item.successfulCount),
        isComplete:
          item.requiredCount != null
            ? item.successfulCount >= item.requiredCount
            : false,
      })),
    );
  } catch (error) {
    return failure(error);
  }
}

export type { AssessmentEngineOptions };
