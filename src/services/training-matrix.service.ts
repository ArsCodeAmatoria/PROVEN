import "server-only";

import type {
  AssessmentOutcome,
  AssessmentRating,
  AssessmentSignerRole,
  EmployeeStatus,
  Prisma,
  TrainingMatrixCellStatus,
} from "@/generated/prisma/client";
import {
  isCompetentAssessmentRating,
  mapStoredStatusToDisplay,
} from "@/lib/training-matrix-status";
import type {
  TrainingMatrixDisplayStatus,
  TrainingMatrixFiltersInput,
} from "@/lib/validations/training-matrix";
import { prisma } from "@/lib/prisma";
import type { ServiceResult } from "@/types";
import { notDeleted } from "@/types";
import { fullName } from "@/utils/format";

import {
  failure,
  getDatabaseConfigError,
  success,
  unavailable,
} from "./base";

export type MatrixWorker = {
  id: string;
  name: string;
  employeeNumber: string | null;
  trade: string | null;
  crew: string | null;
  supervisorId: string | null;
  supervisorName: string | null;
};

export type MatrixCompetency = {
  id: string;
  code: string;
  title: string;
  trade: string | null;
};

export type MatrixCell = {
  employeeId: string;
  competencyId: string;
  status: TrainingMatrixDisplayStatus;
  lastAssessedAt: Date | null;
  entryId: string | null;
};

export type TrainingMatrixData = {
  companyId: string;
  companyName: string;
  workers: MatrixWorker[];
  competencies: MatrixCompetency[];
  cells: MatrixCell[];
  summary: Record<TrainingMatrixDisplayStatus, number>;
};

export type TrainingMatrixFilterOptions = {
  companies: { id: string; name: string }[];
  projects: { id: string; name: string; code: string }[];
  trades: string[];
  crews: string[];
  supervisors: { id: string; label: string }[];
};

export { mapStoredStatusToDisplay };

export function deriveMatrixCellStatus(input: {
  entryStatus?: TrainingMatrixCellStatus | null;
  validUntil?: Date | null;
  outcome?: AssessmentOutcome | null;
  rating?: AssessmentRating | null;
  signatureRoles?: AssessmentSignerRole[];
  assessedAt?: Date | null;
}): {
  status: TrainingMatrixDisplayStatus;
  lastAssessedAt: Date | null;
} {
  const now = new Date();
  const lastAssessedAt = input.assessedAt ?? null;

  if (input.validUntil && input.validUntil < now) {
    return { status: "NEEDS_REASSESSMENT", lastAssessedAt };
  }

  if (
    input.entryStatus === "NEEDS_REASSESSMENT" ||
    input.entryStatus === "EXPIRED"
  ) {
    return { status: "NEEDS_REASSESSMENT", lastAssessedAt };
  }

  if (input.entryStatus === "VERIFIED") {
    return { status: "VERIFIED", lastAssessedAt };
  }

  const roles = new Set(input.signatureRoles ?? []);
  const verifiedSignatures =
    roles.has("INSTRUCTOR") && roles.has("APPRENTICE");

  if (
    isCompetentAssessmentRating(input.rating) ||
    input.outcome === "COMPETENT"
  ) {
    return {
      status: verifiedSignatures ? "VERIFIED" : "COMPETENT",
      lastAssessedAt,
    };
  }

  if (
    input.rating === "NEEDS_IMPROVEMENT" ||
    input.rating === "NOT_OBSERVED" ||
    input.outcome === "NOT_YET_COMPETENT" ||
    input.outcome === "REQUIRES_REVIEW" ||
    input.outcome === "IN_PROGRESS" ||
    input.entryStatus === "IN_PROGRESS"
  ) {
    return { status: "IN_PROGRESS", lastAssessedAt };
  }

  if (input.entryStatus === "COMPETENT") {
    return { status: "COMPETENT", lastAssessedAt };
  }

  return { status: "NOT_STARTED", lastAssessedAt };
}

function emptySummary(): Record<TrainingMatrixDisplayStatus, number> {
  return {
    NOT_STARTED: 0,
    IN_PROGRESS: 0,
    COMPETENT: 0,
    VERIFIED: 0,
    NEEDS_REASSESSMENT: 0,
  };
}

export async function getTrainingMatrixFilterOptions(
  companyId: string,
  memberships: { companyId: string; companyName: string }[] = [],
): Promise<ServiceResult<TrainingMatrixFilterOptions>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [projects, employees, supervisors] = await Promise.all([
      prisma.project.findMany({
        where: { companyId, ...notDeleted },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.employee.findMany({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["ACTIVE", "ON_LEAVE"] },
        },
        select: { trade: true, department: true },
      }),
      prisma.employee.findMany({
        where: {
          companyId,
          ...notDeleted,
          status: { in: ["ACTIVE", "ON_LEAVE"] },
          user: { ...notDeleted, isActive: true },
        },
        include: { user: true },
        orderBy: [
          { user: { lastName: "asc" } },
          { user: { firstName: "asc" } },
        ],
        take: 500,
      }),
    ]);

    const trades = [
      ...new Set(
        employees
          .map((row) => row.trade?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort((a, b) => a.localeCompare(b));

    const crews = [
      ...new Set(
        employees
          .map((row) => row.department?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort((a, b) => a.localeCompare(b));

    const companies =
      memberships.length > 0
        ? memberships.map((item) => ({
            id: item.companyId,
            name: item.companyName,
          }))
        : [];

    const options: TrainingMatrixFilterOptions = {
      companies,
      projects,
      trades,
      crews,
      supervisors: supervisors.map((row) => ({
        id: row.id,
        label: fullName(row.user.firstName, row.user.lastName),
      })),
    };

    return success(options);
  } catch (error) {
    return failure(error);
  }
}

export async function getTrainingMatrix(
  companyId: string,
  filters: TrainingMatrixFiltersInput = {},
): Promise<ServiceResult<TrainingMatrixData>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const company = await prisma.company.findFirst({
      where: { id: companyId, ...notDeleted },
      select: { id: true, name: true },
    });
    if (!company) {
      return failure(new Error("Company not found."));
    }

    const activeStatuses: EmployeeStatus[] = ["ACTIVE", "ON_LEAVE"];

    const workerWhere: Prisma.EmployeeWhereInput = {
      companyId,
      ...notDeleted,
      status: { in: activeStatuses },
      ...(filters.trade ? { trade: filters.trade } : {}),
      ...(filters.crew ? { department: filters.crew } : {}),
      ...(filters.supervisorId
        ? { supervisorId: filters.supervisorId }
        : {}),
      ...(filters.projectId
        ? {
            projectAssignments: {
              some: {
                projectId: filters.projectId,
                ...notDeleted,
              },
            },
          }
        : {}),
    };

    const competencyWhere: Prisma.CompetencyWhereInput = {
      companyId,
      ...notDeleted,
      status: "ACTIVE",
      ...(filters.trade ? { trade: filters.trade } : {}),
    };

    const [workersRaw, competenciesRaw, entries, results] = await Promise.all([
      prisma.employee.findMany({
        where: workerWhere,
        include: {
          user: true,
          supervisor: { include: { user: true } },
        },
        orderBy: [
          { user: { lastName: "asc" } },
          { user: { firstName: "asc" } },
        ],
        take: 150,
      }),
      prisma.competency.findMany({
        where: competencyWhere,
        select: {
          id: true,
          code: true,
          title: true,
          trade: true,
        },
        orderBy: [{ trade: "asc" }, { code: "asc" }, { title: "asc" }],
        take: 80,
      }),
      prisma.trainingMatrixEntry.findMany({
        where: {
          ...notDeleted,
          employee: workerWhere,
          competency: competencyWhere,
        },
        select: {
          id: true,
          employeeId: true,
          competencyId: true,
          status: true,
          lastAssessedAt: true,
        },
      }),
      prisma.assessmentResult.findMany({
        where: {
          ...notDeleted,
          lockedAt: { not: null },
          employee: workerWhere,
          assessment: {
            ...notDeleted,
            companyId,
            competencyId: { not: null },
            competency: competencyWhere,
          },
        },
        select: {
          employeeId: true,
          assessedAt: true,
          validUntil: true,
          outcome: true,
          rating: true,
          assessment: { select: { competencyId: true } },
          signatures: {
            where: notDeleted,
            select: { role: true },
          },
        },
        orderBy: [{ assessedAt: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    const workers: MatrixWorker[] = workersRaw.map((worker) => ({
      id: worker.id,
      name: fullName(worker.user.firstName, worker.user.lastName),
      employeeNumber: worker.employeeNumber,
      trade: worker.trade,
      crew: worker.department,
      supervisorId: worker.supervisorId,
      supervisorName: worker.supervisor
        ? fullName(
            worker.supervisor.user.firstName,
            worker.supervisor.user.lastName,
          )
        : null,
    }));

    const competencies: MatrixCompetency[] = competenciesRaw;

    const entryMap = new Map(
      entries.map((entry) => [
        `${entry.employeeId}:${entry.competencyId}`,
        entry,
      ]),
    );

    const latestResultMap = new Map<
      string,
      (typeof results)[number]
    >();
    for (const result of results) {
      const competencyId = result.assessment.competencyId;
      if (!competencyId) continue;
      const key = `${result.employeeId}:${competencyId}`;
      if (!latestResultMap.has(key)) {
        latestResultMap.set(key, result);
      }
    }

    const cells: MatrixCell[] = [];
    const summary = emptySummary();
    const matchingKeys = new Set<string>();

    for (const worker of workers) {
      for (const competency of competencies) {
        const key = `${worker.id}:${competency.id}`;
        const entry = entryMap.get(key);
        const latest = latestResultMap.get(key);
        const derived = deriveMatrixCellStatus({
          entryStatus: entry?.status,
          validUntil: latest?.validUntil,
          outcome: latest?.outcome,
          rating: latest?.rating,
          signatureRoles: latest?.signatures.map((item) => item.role),
          assessedAt: latest?.assessedAt ?? entry?.lastAssessedAt ?? null,
        });

        summary[derived.status] += 1;

        if (!filters.status || derived.status === filters.status) {
          matchingKeys.add(key);
        }

        cells.push({
          employeeId: worker.id,
          competencyId: competency.id,
          status: derived.status,
          lastAssessedAt: derived.lastAssessedAt,
          entryId: entry?.id ?? null,
        });
      }
    }

    let filteredWorkers = workers;
    let filteredCompetencies = competencies;
    let filteredCells = cells;

    if (filters.status) {
      const workerIds = new Set(
        [...matchingKeys].map((key) => key.split(":")[0]),
      );
      const competencyIds = new Set(
        [...matchingKeys].map((key) => key.split(":")[1]),
      );
      filteredWorkers = workers.filter((worker) => workerIds.has(worker.id));
      filteredCompetencies = competencies.filter((competency) =>
        competencyIds.has(competency.id),
      );
      filteredCells = cells.filter(
        (cell) =>
          workerIds.has(cell.employeeId) &&
          competencyIds.has(cell.competencyId),
      );
    }

    const data: TrainingMatrixData = {
      companyId: company.id,
      companyName: company.name,
      workers: filteredWorkers,
      competencies: filteredCompetencies,
      cells: filteredCells,
      summary,
    };

    return success(data);
  } catch (error) {
    return failure(error);
  }
}
