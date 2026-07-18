import "server-only";

import { type WrittenExam } from "@/generated/prisma/client";
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

export async function listExams(
  organizationId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<WrittenExam>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.writtenExam.findMany({
        where: { organizationId },
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.writtenExam.count({ where: { organizationId } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}
