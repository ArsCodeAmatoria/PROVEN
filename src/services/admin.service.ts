import "server-only";

import type {
  Assessment,
  AuditLog,
  Certificate,
  Company,
  Competency,
  Curriculum,
  Document,
  Employee,
  Observation,
  Prisma,
  Project,
  User,
} from "@/generated/prisma/client";
import { hasSupabaseConfig } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type {
  PaginatedResult,
  PaginationParams,
  ServiceResult,
} from "@/types";
import { notDeleted } from "@/types";

import {
  failure,
  getDatabaseConfigError,
  normalizePagination,
  success,
  toPaginatedResult,
  unavailable,
} from "./base";

const soft = notDeleted;

export type PlatformDashboardStats = {
  companies: number;
  activeWorkers: number;
  activeUsers: number;
  assessors: number;
  apprenticesStudents: number;
  assessmentsCompleted: number;
  assessmentsOutstanding: number;
  lessonProgressCompleted: number;
  lessonProgressInProgress: number;
  lessonProgressNotStarted: number;
  competencies: number;
  certificatesExpiringSoon: number;
  workersHiredThisMonth: number;
  recentAuditLogs: AuditLog[];
  systemHealth: {
    database: boolean;
    supabase: boolean;
  };
};

export type PlatformCompanyListItem = Company & {
  workerCount: number;
  userCount: number;
};

export type PlatformCompanyDetail = Company & {
  workerCount: number;
  activeWorkerCount: number;
  userCount: number;
  assessmentCount: number;
  projectCount: number;
  competencyCount: number;
  certificateCount: number;
  documentCount: number;
};

export type PlatformWorkerItem = Employee & {
  user: Pick<User, "id" | "email" | "firstName" | "lastName" | "isActive" | "lastLoginAt">;
  company: Pick<Company, "id" | "name" | "slug">;
};

export type PlatformUserItem = User & {
  employees: (Pick<Employee, "id" | "role" | "status" | "companyId"> & {
    company: Pick<Company, "id" | "name" | "slug">;
  })[];
};

export type PlatformAssessmentItem = Assessment & {
  company: Pick<Company, "id" | "name" | "slug">;
  competency: { id: string; code: string; title: string } | null;
  assessor: {
    id: string;
    user: Pick<User, "firstName" | "lastName">;
  } | null;
};

export type PlatformObservationItem = Observation & {
  company: Pick<Company, "id" | "name" | "slug">;
  employee: {
    id: string;
    user: Pick<User, "firstName" | "lastName">;
  };
};

export type PlatformProjectItem = Project & {
  company: Pick<Company, "id" | "name" | "slug">;
  _count: { assignments: number };
};

export type PlatformCertificateItem = Certificate & {
  company: Pick<Company, "id" | "name" | "slug">;
  employee: {
    id: string;
    user: Pick<User, "firstName" | "lastName">;
  };
};

export type PlatformCompetencyItem = Competency & {
  company: Pick<Company, "id" | "name" | "slug">;
  category: { id: string; name: string } | null;
};

export type PlatformCurriculumItem = Curriculum & {
  company: Pick<Company, "id" | "name" | "slug"> | null;
  _count: { modules: number; enrolments: number };
};

export type PlatformDocumentItem = Document & {
  company: Pick<Company, "id" | "name" | "slug">;
};

export type PlatformAuditLogItem = AuditLog & {
  company: Pick<Company, "id" | "name" | "slug"> | null;
};

export type PlatformReportsSummary = {
  companies: number;
  workers: number;
  assessments: number;
  observations: number;
  projects: number;
  certificates: number;
  competencies: number;
  documents: number;
  topCompaniesByWorkers: { id: string; name: string; workerCount: number }[];
  recentCompletions: {
    id: string;
    title: string;
    companyName: string;
    completedAt: Date | null;
  }[];
};

export type PlatformAnalyticsData = {
  assessmentsByStatus: { name: string; value: number }[];
  workersByRole: { name: string; value: number }[];
  companiesActiveVsInactive: { name: string; value: number }[];
  observationsByType: { name: string; value: number }[];
  totals: {
    companies: number;
    workers: number;
    assessments: number;
    observations: number;
  };
};

export type PlatformSystemInfo = {
  health: { database: boolean; supabase: boolean };
  counts: {
    companies: number;
    users: number;
    employees: number;
    auditLogs: number;
  };
};

type ListParams = PaginationParams & {
  search?: string;
};

type CompanyListParams = ListParams & {
  status?: "active" | "inactive" | "all";
};

type WorkerListParams = ListParams & {
  companyId?: string;
};

function searchContains(search?: string): string | undefined {
  const trimmed = search?.trim();
  return trimmed || undefined;
}

export async function getPlatformDashboardStats(): Promise<
  ServiceResult<PlatformDashboardStats>
> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      companies,
      activeWorkers,
      activeUsers,
      assessors,
      apprenticesStudents,
      assessmentsCompleted,
      assessmentsOutstanding,
      lessonProgressCompleted,
      lessonProgressInProgress,
      lessonProgressNotStarted,
      competencies,
      certificatesExpiringSoon,
      workersHiredThisMonth,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.company.count({ where: soft }),
      prisma.employee.count({
        where: { ...soft, status: "ACTIVE" },
      }),
      prisma.user.count({ where: { ...soft, isActive: true } }),
      prisma.employee.count({
        where: {
          ...soft,
          role: { in: ["ASSESSOR", "INSTRUCTOR"] },
        },
      }),
      prisma.employee.count({
        where: {
          ...soft,
          role: { in: ["APPRENTICE", "STUDENT"] },
        },
      }),
      prisma.assessment.count({
        where: { ...soft, status: "COMPLETED" },
      }),
      prisma.assessment.count({
        where: {
          ...soft,
          status: { notIn: ["COMPLETED", "CANCELLED"] },
        },
      }),
      prisma.lessonProgress.count({
        where: { ...soft, status: "COMPLETED" },
      }),
      prisma.lessonProgress.count({
        where: { ...soft, status: "IN_PROGRESS" },
      }),
      prisma.lessonProgress.count({
        where: { ...soft, status: "NOT_STARTED" },
      }),
      prisma.competency.count({ where: soft }),
      prisma.certificate.count({
        where: {
          ...soft,
          expiresAt: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
      prisma.employee.count({
        where: {
          ...soft,
          hireDate: { gte: monthStart },
        },
      }),
      prisma.auditLog.findMany({
        where: soft,
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    let databaseHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch {
      databaseHealthy = false;
    }

    return success({
      companies,
      activeWorkers,
      activeUsers,
      assessors,
      apprenticesStudents,
      assessmentsCompleted,
      assessmentsOutstanding,
      lessonProgressCompleted,
      lessonProgressInProgress,
      lessonProgressNotStarted,
      competencies,
      certificatesExpiringSoon,
      workersHiredThisMonth,
      recentAuditLogs,
      systemHealth: {
        database: databaseHealthy,
        supabase: hasSupabaseConfig(),
      },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformCompanies(
  params: CompanyListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformCompanyListItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);
    const status = params.status ?? "all";

    const where: Prisma.CompanyWhereInput = {
      ...soft,
      ...(status === "active" ? { isActive: true } : {}),
      ...(status === "inactive" ? { isActive: false } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { slug: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              employees: { where: soft },
            },
          },
        },
      }),
      prisma.company.count({ where }),
    ]);

    const companyIds = rows.map((row) => row.id);
    const userCounts =
      companyIds.length === 0
        ? []
        : await prisma.employee.groupBy({
            by: ["companyId"],
            where: {
              ...soft,
              companyId: { in: companyIds },
            },
            _count: { userId: true },
          });

    // Employees are 1:1 per company+user, so row count equals user count
    const userCountMap = new Map(
      userCounts.map((item) => [item.companyId, item._count.userId]),
    );

    const result: PlatformCompanyListItem[] = rows.map((row) => {
      const { _count, ...company } = row;
      return {
        ...company,
        workerCount: _count.employees,
        userCount: userCountMap.get(row.id) ?? 0,
      };
    });

    return success(toPaginatedResult(result, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function getPlatformCompany(
  id: string,
): Promise<ServiceResult<PlatformCompanyDetail>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const company = await prisma.company.findFirst({
      where: { id, ...soft },
    });

    if (!company) {
      return { data: null, error: "Company not found." };
    }

    const [
      workerCount,
      activeWorkerCount,
      userCount,
      assessmentCount,
      projectCount,
      competencyCount,
      certificateCount,
      documentCount,
    ] = await Promise.all([
      prisma.employee.count({ where: { companyId: id, ...soft } }),
      prisma.employee.count({
        where: { companyId: id, ...soft, status: "ACTIVE" },
      }),
      prisma.employee.count({ where: { companyId: id, ...soft } }),
      prisma.assessment.count({ where: { companyId: id, ...soft } }),
      prisma.project.count({ where: { companyId: id, ...soft } }),
      prisma.competency.count({ where: { companyId: id, ...soft } }),
      prisma.certificate.count({ where: { companyId: id, ...soft } }),
      prisma.document.count({ where: { companyId: id, ...soft } }),
    ]);

    return success({
      ...company,
      workerCount,
      activeWorkerCount,
      userCount,
      assessmentCount,
      projectCount,
      competencyCount,
      certificateCount,
      documentCount,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformWorkers(
  params: WorkerListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformWorkerItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.EmployeeWhereInput = {
      ...soft,
      ...(params.companyId ? { companyId: params.companyId } : {}),
      ...(q
        ? {
            OR: [
              { employeeNumber: { contains: q, mode: "insensitive" } },
              { title: { contains: q, mode: "insensitive" } },
              { trade: { contains: q, mode: "insensitive" } },
              {
                user: {
                  OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
              {
                company: {
                  name: { contains: q, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: [{ company: { name: "asc" } }, { createdAt: "desc" }],
        skip,
        take: pageSize,
        select: {
          id: true,
          userId: true,
          companyId: true,
          supervisorId: true,
          role: true,
          status: true,
          employeeNumber: true,
          title: true,
          trade: true,
          level: true,
          department: true,
          photoUrl: true,
          hireDate: true,
          terminationDate: true,
          notes: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyContactRelation: true,
          createdAt: true,
          updatedAt: true,
          createdById: true,
          deletedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              isActive: true,
              lastLoginAt: true,
            },
          },
          company: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return success(
      toPaginatedResult(items as PlatformWorkerItem[], total, page, pageSize),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformUsers(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformUserItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.UserWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          employees: {
            where: soft,
            select: {
              id: true,
              role: true,
              status: true,
              companyId: true,
              company: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformAssessments(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformAssessmentItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.AssessmentWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          competency: { select: { id: true, code: true, title: true } },
          assessor: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.assessment.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformObservations(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformObservationItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.ObservationWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { context: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.observation.findMany({
        where,
        orderBy: { observedAt: "desc" },
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          employee: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.observation.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformProjects(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformProjectItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.ProjectWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          _count: { select: { assignments: { where: soft } } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformCertificates(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformCertificateItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.CertificateWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { issuer: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        orderBy: { expiresAt: "asc" },
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          employee: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformCompetencies(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformCompetencyItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.CompetencyWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.competency.findMany({
        where,
        orderBy: { title: "asc" },
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.competency.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformCurriculum(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformCurriculumItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.CurriculumWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.curriculum.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              modules: { where: soft },
              enrolments: { where: soft },
            },
          },
        },
      }),
      prisma.curriculum.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformDocuments(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformDocumentItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.DocumentWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function listPlatformAuditLogs(
  params: ListParams = {},
): Promise<ServiceResult<PaginatedResult<PlatformAuditLogItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(params);
    const q = searchContains(params.search);

    const where: Prisma.AuditLogWhereInput = {
      ...soft,
      ...(q
        ? {
            OR: [
              { summary: { contains: q, mode: "insensitive" } },
              { entityType: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

export async function getPlatformReportsSummary(): Promise<
  ServiceResult<PlatformReportsSummary>
> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [
      companies,
      workers,
      assessments,
      observations,
      projects,
      certificates,
      competencies,
      documents,
      companyWorkerGroups,
      recentCompletions,
    ] = await Promise.all([
      prisma.company.count({ where: soft }),
      prisma.employee.count({ where: soft }),
      prisma.assessment.count({ where: soft }),
      prisma.observation.count({ where: soft }),
      prisma.project.count({ where: soft }),
      prisma.certificate.count({ where: soft }),
      prisma.competency.count({ where: soft }),
      prisma.document.count({ where: soft }),
      prisma.employee.groupBy({
        by: ["companyId"],
        where: soft,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.assessment.findMany({
        where: { ...soft, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          completedAt: true,
          company: { select: { name: true } },
        },
      }),
    ]);

    const companyIds = companyWorkerGroups.map((g) => g.companyId);
    const companyNames =
      companyIds.length === 0
        ? []
        : await prisma.company.findMany({
            where: { id: { in: companyIds }, ...soft },
            select: { id: true, name: true },
          });
    const nameMap = new Map(companyNames.map((c) => [c.id, c.name]));

    return success({
      companies,
      workers,
      assessments,
      observations,
      projects,
      certificates,
      competencies,
      documents,
      topCompaniesByWorkers: companyWorkerGroups.map((g) => ({
        id: g.companyId,
        name: nameMap.get(g.companyId) ?? "Unknown",
        workerCount: g._count.id,
      })),
      recentCompletions: recentCompletions.map((a) => ({
        id: a.id,
        title: a.title,
        companyName: a.company.name,
        completedAt: a.completedAt,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function getPlatformAnalyticsData(): Promise<
  ServiceResult<PlatformAnalyticsData>
> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const [
      assessmentGroups,
      roleGroups,
      activeCompanies,
      inactiveCompanies,
      observationGroups,
      companies,
      workers,
      assessments,
      observations,
    ] = await Promise.all([
      prisma.assessment.groupBy({
        by: ["status"],
        where: soft,
        _count: { id: true },
      }),
      prisma.employee.groupBy({
        by: ["role"],
        where: soft,
        _count: { id: true },
      }),
      prisma.company.count({ where: { ...soft, isActive: true } }),
      prisma.company.count({ where: { ...soft, isActive: false } }),
      prisma.observation.groupBy({
        by: ["observationType"],
        where: soft,
        _count: { id: true },
      }),
      prisma.company.count({ where: soft }),
      prisma.employee.count({ where: soft }),
      prisma.assessment.count({ where: soft }),
      prisma.observation.count({ where: soft }),
    ]);

    return success({
      assessmentsByStatus: assessmentGroups.map((g) => ({
        name: g.status,
        value: g._count.id,
      })),
      workersByRole: roleGroups.map((g) => ({
        name: g.role,
        value: g._count.id,
      })),
      companiesActiveVsInactive: [
        { name: "Active", value: activeCompanies },
        { name: "Inactive", value: inactiveCompanies },
      ],
      observationsByType: observationGroups.map((g) => ({
        name: g.observationType,
        value: g._count.id,
      })),
      totals: { companies, workers, assessments, observations },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function getPlatformSystemInfo(): Promise<
  ServiceResult<PlatformSystemInfo>
> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    let databaseHealthy = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseHealthy = true;
    } catch {
      databaseHealthy = false;
    }

    const [companies, users, employees, auditLogs] = await Promise.all([
      prisma.company.count({ where: soft }),
      prisma.user.count({ where: soft }),
      prisma.employee.count({ where: soft }),
      prisma.auditLog.count({ where: soft }),
    ]);

    return success({
      health: {
        database: databaseHealthy,
        supabase: hasSupabaseConfig(),
      },
      counts: { companies, users, employees, auditLogs },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function createPlatformCompany(data: {
  name: string;
  slug: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  isActive?: boolean;
  createdById?: string | null;
}): Promise<ServiceResult<Company>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const company = await prisma.company.create({
      data: {
        name: data.name,
        slug: data.slug,
        phone: data.phone ?? null,
        website: data.website ?? null,
        address: data.address ?? null,
        logoUrl: data.logoUrl ?? null,
        primaryColor: data.primaryColor ?? null,
        secondaryColor: data.secondaryColor ?? null,
        isActive: data.isActive ?? true,
        createdById: data.createdById ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        actorUserId: data.createdById ?? null,
        action: "CREATE",
        entityType: "Company",
        entityId: company.id,
        summary: `Created company ${company.name}`,
        afterData: {
          name: company.name,
          slug: company.slug,
          isActive: company.isActive,
        },
      },
    });

    return success(company);
  } catch (error) {
    return failure(error);
  }
}

export async function updatePlatformCompany(
  id: string,
  data: {
    name?: string;
    slug?: string;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    isActive?: boolean;
  },
  actorUserId?: string | null,
): Promise<ServiceResult<Company>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.company.findFirst({
      where: { id, ...soft },
    });
    if (!existing) {
      return { data: null, error: "Company not found." };
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.website !== undefined ? { website: data.website } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
        ...(data.primaryColor !== undefined
          ? { primaryColor: data.primaryColor }
          : {}),
        ...(data.secondaryColor !== undefined
          ? { secondaryColor: data.secondaryColor }
          : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        actorUserId: actorUserId ?? null,
        action: "UPDATE",
        entityType: "Company",
        entityId: company.id,
        summary: `Updated company ${company.name}`,
        beforeData: {
          name: existing.name,
          slug: existing.slug,
          isActive: existing.isActive,
        },
        afterData: {
          name: company.name,
          slug: company.slug,
          isActive: company.isActive,
        },
      },
    });

    return success(company);
  } catch (error) {
    return failure(error);
  }
}

export async function archivePlatformCompany(
  id: string,
  actorUserId?: string | null,
): Promise<ServiceResult<Company>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.company.findFirst({
      where: { id, ...soft },
    });
    if (!existing) {
      return { data: null, error: "Company not found." };
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        actorUserId: actorUserId ?? null,
        action: "DELETE",
        entityType: "Company",
        entityId: company.id,
        summary: `Archived company ${existing.name}`,
        beforeData: { deletedAt: null, isActive: existing.isActive },
        afterData: { deletedAt: company.deletedAt, isActive: false },
      },
    });

    return success(company);
  } catch (error) {
    return failure(error);
  }
}

export async function findAvailableCompanySlug(
  base: string,
): Promise<string> {
  let slug = base || "company";
  let attempt = 0;
  while (
    await prisma.company.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    })
  ) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}
