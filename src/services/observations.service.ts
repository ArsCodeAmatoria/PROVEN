import "server-only";

import { type Observation } from "@/generated/prisma/client";
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

export async function listObservations(
  companyId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<Observation>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.observation.findMany({
        where: { companyId, ...notDeleted },
        orderBy: { observedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.observation.count({
        where: { companyId, ...notDeleted },
      }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}
