import "server-only";

import { type InstructorObservation } from "@/generated/prisma/client";
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

export async function listObservations(
  companyId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<InstructorObservation>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.instructorObservation.findMany({
        where: { observed: { companyId } },
        orderBy: { observedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.instructorObservation.count({
        where: { observed: { companyId } },
      }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}
