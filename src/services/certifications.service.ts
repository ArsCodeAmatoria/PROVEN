import "server-only";

import { type Certificate } from "@/generated/prisma/client";
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

export async function listCertificates(
  companyId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<Certificate>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.certificate.findMany({
        where: { companyId, ...notDeleted },
        orderBy: { expiresAt: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.certificate.count({ where: { companyId, ...notDeleted } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

/** @deprecated Use listCertificates */
export async function listCertifications(
  companyId: string,
  params: PaginationParams = {},
) {
  return listCertificates(companyId, params);
}
