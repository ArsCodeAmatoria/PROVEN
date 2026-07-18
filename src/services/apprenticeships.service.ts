import "server-only";

import { type Project } from "@/generated/prisma/client";
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

export async function listProjects(
  companyId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<Project>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where: { companyId, ...notDeleted },
        orderBy: { startDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.project.count({ where: { companyId, ...notDeleted } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

/** @deprecated Prefer listProjects — apprenticeships replaced by projects + training matrix. */
export async function listApprenticeships(
  companyId: string,
  params: PaginationParams = {},
) {
  return listProjects(companyId, params);
}
