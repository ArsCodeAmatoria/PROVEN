import "server-only";

import type { Employee, User } from "@/generated/prisma/client";
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

export type EmployeeWithUser = Employee & { user: User };

export async function listPeople(
  companyId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<EmployeeWithUser>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where: {
          companyId,
          status: "ACTIVE",
          ...notDeleted,
          user: { ...notDeleted, isActive: true },
        },
        include: { user: true },
        orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
        skip,
        take: pageSize,
      }),
      prisma.employee.count({
        where: {
          companyId,
          status: "ACTIVE",
          ...notDeleted,
          user: { ...notDeleted, isActive: true },
        },
      }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}
