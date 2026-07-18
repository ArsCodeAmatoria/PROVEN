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
  companyId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<ContinuousAssessment>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.continuousAssessment.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.continuousAssessment.count({ where: { companyId } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function countOpenAssessments(
  companyId: string,
): Promise<ServiceResult<number>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const count = await prisma.continuousAssessment.count({
      where: {
        companyId,
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
