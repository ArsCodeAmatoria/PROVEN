import "server-only";

import { type Assessment } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PaginatedResult,
  PaginationParams,
  ServiceResult,
} from "@/types";
import { notDeleted } from "@/types";

import {
  failure,
  normalizePagination,
  getDatabaseConfigError,
  unavailable,
  success,
  toPaginatedResult,
} from "./base";

export async function listAssessments(
  companyId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<Assessment>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.assessment.findMany({
        where: { companyId, ...notDeleted },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.assessment.count({ where: { companyId, ...notDeleted } }),
    ]);

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
