import "server-only";

import { type Apprenticeship } from "@/generated/prisma/client";
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

export async function listApprenticeships(
  companyId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<Apprenticeship>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.apprenticeship.findMany({
        where: { companyId },
        orderBy: { startDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.apprenticeship.count({ where: { companyId } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}
