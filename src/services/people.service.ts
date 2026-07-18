import "server-only";

import { type Profile } from "@/generated/prisma/client";
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

export async function listPeople(
  organizationId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<Profile>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.profile.findMany({
        where: { organizationId, isActive: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.profile.count({ where: { organizationId, isActive: true } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}
