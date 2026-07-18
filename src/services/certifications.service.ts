import "server-only";

import { type Certification } from "@/generated/prisma/client";
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

export async function listCertifications(
  organizationId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<Certification>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.certification.findMany({
        where: { organizationId },
        orderBy: { expiresAt: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.certification.count({ where: { organizationId } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}
