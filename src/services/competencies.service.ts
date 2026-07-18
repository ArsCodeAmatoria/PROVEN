import "server-only";

import { CompetencyStatus, type Competency } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { CreateCompetencyInput } from "@/lib/validations";
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

export async function listCompetencies(
  organizationId: string,
  params: PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<Competency>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);

    const [items, total] = await Promise.all([
      prisma.competency.findMany({
        where: { organizationId },
        orderBy: [{ trade: "asc" }, { code: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.competency.count({ where: { organizationId } }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function createCompetency(
  organizationId: string,
  input: CreateCompetencyInput,
): Promise<ServiceResult<Competency>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const competency = await prisma.competency.create({
      data: {
        organizationId,
        code: input.code,
        title: input.title,
        description: input.description,
        category: input.category,
        trade: input.trade,
        level: input.level,
        status: CompetencyStatus.DRAFT,
      },
    });

    return success(competency);
  } catch (error) {
    return failure(error);
  }
}

export async function getCompetencyById(
  id: string,
): Promise<ServiceResult<Competency>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const competency = await prisma.competency.findUnique({ where: { id } });
    if (!competency) {
      return { data: null, error: "Competency not found" };
    }
    return success(competency);
  } catch (error) {
    return failure(error);
  }
}
