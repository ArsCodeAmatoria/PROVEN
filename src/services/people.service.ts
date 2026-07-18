import "server-only";

import type {
  AssessmentResult,
  AuditLog,
  Certificate,
  Company,
  Document,
  Employee,
  EmployeeHour,
  ExamResult,
  Observation,
  Prisma,
  TrainingMatrixEntry,
  User,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  PaginatedResult,
  PaginationParams,
  ServiceResult,
} from "@/types";
import { notDeleted } from "@/types";
import { fullName } from "@/utils/format";

import {
  failure,
  getDatabaseConfigError,
  normalizePagination,
  success,
  toPaginatedResult,
  unavailable,
} from "./base";

export type EmployeeListItem = Employee & {
  user: User;
  company: Company;
  supervisor: (Employee & { user: User }) | null;
  totalHours: number;
  certificateCount: number;
};

export type EmployeeDetail = Employee & {
  user: User;
  company: Company;
  supervisor: (Employee & { user: User }) | null;
  reports: (Employee & { user: User })[];
  totalHours: number;
  certificates: Certificate[];
  trainingMatrixEntries: (TrainingMatrixEntry & {
    competency: { id: string; code: string; title: string; trade: string | null; level: number };
  })[];
  assessmentResults: (AssessmentResult & {
    assessment: { id: string; title: string; type: string; status: string };
    assessor: (Employee & { user: User }) | null;
  })[];
  examResults: (ExamResult & {
    exam: { id: string; code: string; title: string };
  })[];
  employeeHours: (EmployeeHour & {
    project: { id: string; code: string; name: string } | null;
  })[];
  documents: Document[];
  observationsReceived: (Observation & {
    observer: Employee & { user: User };
    competency: { id: string; title: string } | null;
  })[];
  auditLogs: AuditLog[];
  timeline: EmployeeTimelineItem[];
};

export type EmployeeTimelineItem = {
  id: string;
  type: "assessment" | "exam" | "hour" | "certificate" | "observation" | "audit";
  title: string;
  summary: string | null;
  occurredAt: Date;
};

export type EmployeeListFilters = PaginationParams & {
  q?: string;
  status?: string;
  trade?: string;
  level?: number;
  supervisorId?: string;
};

export type EmployeeOption = {
  id: string;
  label: string;
  employeeNumber: string | null;
};

export type CreateEmployeeData = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  employeeNumber?: string | null;
  title?: string | null;
  trade?: string | null;
  level?: number;
  department?: string | null;
  role: Employee["role"];
  status: Employee["status"];
  supervisorId?: string | null;
  hireDate?: Date | null;
  notes?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  authUserId: string;
  createdById?: string | null;
};

export type UpdateEmployeeData = Omit<
  CreateEmployeeData,
  "email" | "authUserId" | "firstName" | "lastName"
> & {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string;
};

function emptyToNull(value?: string | null) {
  if (value === undefined) return undefined;
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function sumHours(employeeId: string) {
  const aggregate = await prisma.employeeHour.aggregate({
    where: { employeeId, ...notDeleted },
    _sum: { hours: true },
  });
  return Number(aggregate._sum.hours ?? 0);
}

function buildListWhere(
  companyId: string,
  filters: EmployeeListFilters,
): Prisma.EmployeeWhereInput {
  const q = filters.q?.trim();

  return {
    companyId,
    ...notDeleted,
    ...(filters.status ? { status: filters.status as Employee["status"] } : {}),
    ...(filters.trade ? { trade: { equals: filters.trade, mode: "insensitive" } } : {}),
    ...(filters.level ? { level: filters.level } : {}),
    ...(filters.supervisorId ? { supervisorId: filters.supervisorId } : {}),
    ...(q
      ? {
          OR: [
            { employeeNumber: { contains: q, mode: "insensitive" } },
            { trade: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
            {
              user: {
                OR: [
                  { firstName: { contains: q, mode: "insensitive" } },
                  { lastName: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
    user: { ...notDeleted },
  };
}

export async function listEmployees(
  companyId: string,
  filters: EmployeeListFilters = {},
): Promise<ServiceResult<PaginatedResult<EmployeeListItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(filters);
    const where = buildListWhere(companyId, filters);

    const [rows, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: true,
          company: true,
          supervisor: { include: { user: true } },
          _count: { select: { certificates: { where: notDeleted } } },
        },
        orderBy: [
          { user: { lastName: "asc" } },
          { user: { firstName: "asc" } },
        ],
        skip,
        take: pageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    const hourRows = await prisma.employeeHour.groupBy({
      by: ["employeeId"],
      where: {
        employeeId: { in: rows.map((row) => row.id) },
        ...notDeleted,
      },
      _sum: { hours: true },
    });

    const hoursByEmployee = new Map(
      hourRows.map((row) => [row.employeeId, Number(row._sum.hours ?? 0)]),
    );

    const items: EmployeeListItem[] = rows.map((row) => {
      const { _count, ...employee } = row;
      return {
        ...employee,
        totalHours: hoursByEmployee.get(row.id) ?? 0,
        certificateCount: _count.certificates,
      };
    });

    return success(toPaginatedResult(items, total, page, pageSize));
  } catch (error) {
    return failure(error);
  }
}

/** @deprecated Prefer listEmployees */
export async function listPeople(
  companyId: string,
  params: PaginationParams = {},
) {
  return listEmployees(companyId, params);
}

export async function getEmployeeById(
  companyId: string,
  employeeId: string,
): Promise<ServiceResult<EmployeeDetail>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, ...notDeleted },
      include: {
        user: true,
        company: true,
        supervisor: { include: { user: true } },
        reports: {
          where: notDeleted,
          include: { user: true },
          orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
        },
        certificates: {
          where: notDeleted,
          orderBy: { expiresAt: "asc" },
        },
        trainingMatrixEntries: {
          where: notDeleted,
          include: {
            competency: {
              select: {
                id: true,
                code: true,
                title: true,
                trade: true,
                level: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        assessmentResults: {
          where: notDeleted,
          include: {
            assessment: {
              select: { id: true, title: true, type: true, status: true },
            },
            assessor: { include: { user: true } },
          },
          orderBy: { assessedAt: "desc" },
        },
        examResults: {
          where: notDeleted,
          include: {
            exam: { select: { id: true, code: true, title: true } },
          },
          orderBy: { startedAt: "desc" },
        },
        employeeHours: {
          where: notDeleted,
          include: {
            project: { select: { id: true, code: true, name: true } },
          },
          orderBy: { workDate: "desc" },
          take: 100,
        },
        observationsReceived: {
          where: notDeleted,
          include: {
            observer: { include: { user: true } },
            competency: { select: { id: true, title: true } },
          },
          orderBy: { observedAt: "desc" },
          take: 50,
        },
      },
    });

    if (!employee) {
      return { data: null, error: "Employee not found." };
    }

    const [documents, auditLogs, totalHours] = await Promise.all([
      prisma.document.findMany({
        where: {
          companyId,
          entityType: "EMPLOYEE",
          entityId: employeeId,
          ...notDeleted,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: {
          companyId,
          entityType: "Employee",
          entityId: employeeId,
          ...notDeleted,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      sumHours(employeeId),
    ]);

    const timeline: EmployeeTimelineItem[] = [
      ...employee.assessmentResults.map((item) => ({
        id: `assessment-${item.id}`,
        type: "assessment" as const,
        title: item.assessment.title,
        summary: item.outcome,
        occurredAt: item.assessedAt ?? item.createdAt,
      })),
      ...employee.examResults.map((item) => ({
        id: `exam-${item.id}`,
        type: "exam" as const,
        title: item.exam.title,
        summary: item.passed == null ? item.status : item.passed ? "Passed" : "Failed",
        occurredAt: item.submittedAt ?? item.startedAt,
      })),
      ...employee.employeeHours.map((item) => ({
        id: `hour-${item.id}`,
        type: "hour" as const,
        title: `${Number(item.hours)} hrs`,
        summary: item.project?.name ?? item.description,
        occurredAt: item.workDate,
      })),
      ...employee.certificates.map((item) => ({
        id: `certificate-${item.id}`,
        type: "certificate" as const,
        title: item.name,
        summary: item.status,
        occurredAt: item.issuedAt ?? item.createdAt,
      })),
      ...employee.observationsReceived.map((item) => ({
        id: `observation-${item.id}`,
        type: "observation" as const,
        title: item.context,
        summary: item.rating,
        occurredAt: item.observedAt,
      })),
      ...auditLogs.map((item) => ({
        id: `audit-${item.id}`,
        type: "audit" as const,
        title: item.action,
        summary: item.summary,
        occurredAt: item.createdAt,
      })),
    ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    return success({
      ...employee,
      documents,
      auditLogs,
      totalHours,
      timeline,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function listSupervisorOptions(
  companyId: string,
  excludeEmployeeId?: string,
): Promise<ServiceResult<EmployeeOption[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const rows = await prisma.employee.findMany({
      where: {
        companyId,
        ...notDeleted,
        status: { in: ["ACTIVE", "ON_LEAVE"] },
        ...(excludeEmployeeId ? { id: { not: excludeEmployeeId } } : {}),
        user: { ...notDeleted, isActive: true },
      },
      include: { user: true },
      orderBy: [{ user: { lastName: "asc" } }, { user: { firstName: "asc" } }],
      take: 500,
    });

    return success(
      rows.map((row) => ({
        id: row.id,
        label: fullName(row.user.firstName, row.user.lastName),
        employeeNumber: row.employeeNumber,
      })),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function listTradeOptions(
  companyId: string,
): Promise<ServiceResult<string[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const rows = await prisma.employee.findMany({
      where: {
        companyId,
        ...notDeleted,
        trade: { not: null },
      },
      select: { trade: true },
      distinct: ["trade"],
      orderBy: { trade: "asc" },
    });

    return success(
      rows
        .map((row) => row.trade)
        .filter((trade): trade is string => Boolean(trade)),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      ...notDeleted,
    },
  });
}

export async function createEmployeeRecord(
  companyId: string,
  data: CreateEmployeeData,
): Promise<ServiceResult<EmployeeListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existingMembership = await prisma.employee.findFirst({
      where: {
        companyId,
        user: {
          email: { equals: data.email, mode: "insensitive" },
        },
        ...notDeleted,
      },
    });

    if (existingMembership) {
      return {
        data: null,
        error: "This person is already an employee of this company.",
      };
    }

    const user = await prisma.user.upsert({
      where: { authUserId: data.authUserId },
      create: {
        authUserId: data.authUserId,
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: emptyToNull(data.phone) ?? null,
        createdById: data.createdById ?? null,
        settings: { create: {} },
      },
      update: {
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        phone: emptyToNull(data.phone) ?? null,
        isActive: true,
        deletedAt: null,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        companyId,
        supervisorId: data.supervisorId || null,
        role: data.role,
        status: data.status,
        employeeNumber: emptyToNull(data.employeeNumber) ?? null,
        title: emptyToNull(data.title) ?? null,
        trade: emptyToNull(data.trade) ?? null,
        level: data.level ?? 1,
        department: emptyToNull(data.department) ?? null,
        hireDate: data.hireDate ?? null,
        notes: emptyToNull(data.notes) ?? null,
        emergencyContactName: emptyToNull(data.emergencyContactName) ?? null,
        emergencyContactPhone: emptyToNull(data.emergencyContactPhone) ?? null,
        emergencyContactRelation:
          emptyToNull(data.emergencyContactRelation) ?? null,
        createdById: data.createdById ?? null,
      },
      include: {
        user: true,
        company: true,
        supervisor: { include: { user: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: data.createdById ?? null,
        action: "CREATE",
        entityType: "Employee",
        entityId: employee.id,
        summary: `Created employee ${fullName(user.firstName, user.lastName)}`,
        afterData: {
          employeeNumber: employee.employeeNumber,
          role: employee.role,
          status: employee.status,
        },
      },
    });

    return success({
      ...employee,
      totalHours: 0,
      certificateCount: 0,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function updateEmployeeRecord(
  companyId: string,
  employeeId: string,
  data: UpdateEmployeeData,
  actorUserId?: string | null,
): Promise<ServiceResult<EmployeeListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, ...notDeleted },
      include: { user: true },
    });

    if (!existing) {
      return { data: null, error: "Employee not found." };
    }

    if (data.supervisorId === employeeId) {
      return { data: null, error: "An employee cannot supervise themselves." };
    }

    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
        ...(data.phone !== undefined
          ? { phone: emptyToNull(data.phone) ?? null }
          : {}),
        ...(data.email !== undefined
          ? { email: data.email.toLowerCase() }
          : {}),
      },
    });

    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        supervisorId: data.supervisorId || null,
        role: data.role,
        status: data.status,
        employeeNumber: emptyToNull(data.employeeNumber) ?? null,
        title: emptyToNull(data.title) ?? null,
        trade: emptyToNull(data.trade) ?? null,
        level: data.level ?? 1,
        department: emptyToNull(data.department) ?? null,
        hireDate: data.hireDate ?? null,
        notes: emptyToNull(data.notes) ?? null,
        emergencyContactName: emptyToNull(data.emergencyContactName) ?? null,
        emergencyContactPhone: emptyToNull(data.emergencyContactPhone) ?? null,
        emergencyContactRelation:
          emptyToNull(data.emergencyContactRelation) ?? null,
      },
      include: {
        user: true,
        company: true,
        supervisor: { include: { user: true } },
        _count: { select: { certificates: { where: notDeleted } } },
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "UPDATE",
        entityType: "Employee",
        entityId: employeeId,
        summary: `Updated employee ${fullName(employee.user.firstName, employee.user.lastName)}`,
        beforeData: {
          role: existing.role,
          status: existing.status,
          trade: existing.trade,
          level: existing.level,
        },
        afterData: {
          role: employee.role,
          status: employee.status,
          trade: employee.trade,
          level: employee.level,
        },
      },
    });

    const { _count, ...rest } = employee;
    return success({
      ...rest,
      totalHours: await sumHours(employeeId),
      certificateCount: _count.certificates,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteEmployee(
  companyId: string,
  employeeId: string,
  actorUserId?: string | null,
): Promise<ServiceResult<{ id: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, ...notDeleted },
      include: { user: true },
    });

    if (!existing) {
      return { data: null, error: "Employee not found." };
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        deletedAt: new Date(),
        status: "TERMINATED",
        terminationDate: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "DELETE",
        entityType: "Employee",
        entityId: employeeId,
        summary: `Removed employee ${fullName(existing.user.firstName, existing.user.lastName)}`,
      },
    });

    return success({ id: employeeId });
  } catch (error) {
    return failure(error);
  }
}

export async function updateEmployeePhoto(
  companyId: string,
  employeeId: string,
  photoUrl: string | null,
  actorUserId?: string | null,
): Promise<ServiceResult<{ photoUrl: string | null }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, ...notDeleted },
    });

    if (!existing) {
      return { data: null, error: "Employee not found." };
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: { photoUrl },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actorUserId ?? null,
        action: "UPDATE",
        entityType: "Employee",
        entityId: employeeId,
        summary: photoUrl ? "Updated employee photo" : "Removed employee photo",
      },
    });

    return success({ photoUrl });
  } catch (error) {
    return failure(error);
  }
}
