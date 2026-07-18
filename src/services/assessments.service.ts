import "server-only";

import {
  AssessmentOutcome,
  type ContinuousAssessment,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PaginatedResult,
  PaginationParams,
  ServiceResult,
} from "@/types";

import {
  failure,
  normalizePagination,
  getDatabaseConfigError,
  unavailable,
  success,
  toPaginatedResult,
} from "./base";

export async function listContinuousAssessments(
  organizationId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<ContinuousAssessment>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.continuousAssessment.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.continuousAssessment.count({ where: { organizationId } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function countOpenAssessments(
  organizationId: string,
): Promise<ServiceResult<number>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const count = await prisma.continuousAssessment.count({
      where: {
        organizationId,
        outcome: {
          in: [AssessmentOutcome.NOT_STARTED, AssessmentOutcome.IN_PROGRESS],
        },
      },
    });
    return success(count);
  } catch (error) {
    return failure(error);
  }
}
