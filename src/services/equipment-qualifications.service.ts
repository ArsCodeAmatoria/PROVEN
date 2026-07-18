import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  CreateEquipmentQualificationInput,
  EquipmentQualificationListFiltersInput,
} from "@/lib/validations/equipment-qualification";
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

const DEFAULT_EQUIPMENT_TYPES = [
  { code: "TOWER_CRANE", name: "Tower Crane" },
  { code: "MOBILE_CRANE", name: "Mobile Crane" },
  { code: "SELF_ERECT_CRANE", name: "Self-Erect Crane" },
  { code: "TELEHANDLER", name: "Telehandler" },
  { code: "EXCAVATOR", name: "Excavator" },
  { code: "FORKLIFT", name: "Forklift" },
  { code: "SKID_STEER", name: "Skid Steer" },
  { code: "MEWP", name: "MEWP" },
] as const;

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function deriveStatus(
  status: string,
  expiresAt: Date | null,
): "ACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED" {
  if (status === "SUSPENDED" || status === "REVOKED") {
    return status;
  }
  if (expiresAt && expiresAt < new Date()) {
    return "EXPIRED";
  }
  return status === "EXPIRED" ? "EXPIRED" : "ACTIVE";
}

export type EquipmentQualificationOptions = {
  employees: { id: string; label: string }[];
  assessors: { id: string; label: string }[];
  equipmentTypes: { id: string; label: string; code: string }[];
  equipment: {
    id: string;
    label: string;
    equipmentTypeId: string;
  }[];
  assessments: { id: string; label: string; employeeId: string | null }[];
};

export type EquipmentQualificationListItem = {
  id: string;
  make: string;
  model: string;
  capacity: string | null;
  qualifiedAt: Date;
  expiresAt: Date | null;
  status: string;
  displayStatus: string;
  employee: { id: string; name: string };
  equipmentType: { id: string; name: string; code: string };
  equipment: { id: string; name: string; assetTag: string } | null;
  assessor: { id: string; name: string } | null;
  assessmentCount: number;
};

export type EquipmentQualificationDetail = EquipmentQualificationListItem & {
  notes: string | null;
  assessments: {
    id: string;
    assessmentId: string;
    title: string;
    completedAt: Date | null;
  }[];
};

export type ActiveEndorsement = {
  id: string;
  equipmentTypeName: string;
  make: string;
  model: string;
  capacity: string | null;
  qualifiedAt: Date;
  expiresAt: Date | null;
};

export async function ensureDefaultEquipmentTypes(
  companyId: string,
  createdById?: string | null,
) {
  const existing = await prisma.equipmentType.findMany({
    where: { companyId, ...notDeleted },
    select: { code: true },
  });
  const existingCodes = new Set(existing.map((item) => item.code));
  const missing = DEFAULT_EQUIPMENT_TYPES.filter(
    (item) => !existingCodes.has(item.code),
  );
  if (missing.length === 0) return;

  await prisma.equipmentType.createMany({
    data: missing.map((item) => ({
      companyId,
      code: item.code,
      name: item.name,
      description: `${item.name} equipment class`,
      createdById: createdById ?? null,
    })),
    skipDuplicates: true,
  });
}

export async function getEquipmentQualificationOptions(
  companyId: string,
): Promise<ServiceResult<EquipmentQualificationOptions>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    await ensureDefaultEquipmentTypes(companyId);

    const [employees, equipmentTypes, equipment, assessments] =
      await Promise.all([
        prisma.employee.findMany({
          where: {
            companyId,
            ...notDeleted,
            status: { in: ["ACTIVE", "ON_LEAVE"] },
          },
          include: { user: true },
          orderBy: [
            { user: { lastName: "asc" } },
            { user: { firstName: "asc" } },
          ],
          take: 500,
        }),
        prisma.equipmentType.findMany({
          where: { companyId, ...notDeleted },
          orderBy: { name: "asc" },
        }),
        prisma.equipment.findMany({
          where: { companyId, ...notDeleted },
          orderBy: { name: "asc" },
          take: 300,
        }),
        prisma.assessment.findMany({
          where: {
            companyId,
            ...notDeleted,
            status: "COMPLETED",
          },
          include: {
            results: {
              where: notDeleted,
              select: { employeeId: true },
              take: 1,
            },
            competency: { select: { code: true } },
          },
          orderBy: { completedAt: "desc" },
          take: 200,
        }),
      ]);

    return success({
      employees: employees.map((row) => ({
        id: row.id,
        label: fullName(row.user.firstName, row.user.lastName),
      })),
      assessors: employees.map((row) => ({
        id: row.id,
        label: fullName(row.user.firstName, row.user.lastName),
      })),
      equipmentTypes: equipmentTypes.map((row) => ({
        id: row.id,
        label: row.name,
        code: row.code,
      })),
      equipment: equipment.map((row) => ({
        id: row.id,
        label: `${row.assetTag} · ${row.name}`,
        equipmentTypeId: row.equipmentTypeId,
      })),
      assessments: assessments.map((row) => ({
        id: row.id,
        label: `${row.title}${row.competency?.code ? ` (${row.competency.code})` : ""}`,
        employeeId: row.results[0]?.employeeId ?? null,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

function buildListWhere(
  companyId: string,
  filters: Partial<EquipmentQualificationListFiltersInput> = {},
): Prisma.EquipmentQualificationWhereInput {
  const and: Prisma.EquipmentQualificationWhereInput[] = [
    { companyId },
    notDeleted,
  ];

  if (filters.employeeId) and.push({ employeeId: filters.employeeId });
  if (filters.equipmentTypeId) {
    and.push({ equipmentTypeId: filters.equipmentTypeId });
  }
  if (filters.status) and.push({ status: filters.status });

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { make: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { capacity: { contains: q, mode: "insensitive" } },
        { equipmentType: { name: { contains: q, mode: "insensitive" } } },
        {
          employee: {
            user: {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  return { AND: and };
}

const listInclude = {
  employee: { include: { user: true } },
  equipmentType: true,
  equipment: true,
  assessor: { include: { user: true } },
  assessments: {
    where: notDeleted,
    select: { id: true },
  },
} as const;

function mapListItem(row: {
  id: string;
  make: string;
  model: string;
  capacity: string | null;
  qualifiedAt: Date;
  expiresAt: Date | null;
  status: string;
  employee: { id: string; user: { firstName: string; lastName: string } };
  equipmentType: { id: string; name: string; code: string };
  equipment: { id: string; name: string; assetTag: string } | null;
  assessor: {
    id: string;
    user: { firstName: string; lastName: string };
  } | null;
  assessments: { id: string }[];
}): EquipmentQualificationListItem {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    capacity: row.capacity,
    qualifiedAt: row.qualifiedAt,
    expiresAt: row.expiresAt,
    status: row.status,
    displayStatus: deriveStatus(row.status, row.expiresAt),
    employee: {
      id: row.employee.id,
      name: fullName(row.employee.user.firstName, row.employee.user.lastName),
    },
    equipmentType: row.equipmentType,
    equipment: row.equipment,
    assessor: row.assessor
      ? {
          id: row.assessor.id,
          name: fullName(
            row.assessor.user.firstName,
            row.assessor.user.lastName,
          ),
        }
      : null,
    assessmentCount: row.assessments.length,
  };
}

export async function listEquipmentQualifications(
  companyId: string,
  filters: Partial<EquipmentQualificationListFiltersInput> &
    PaginationParams = {},
): Promise<ServiceResult<PaginatedResult<EquipmentQualificationListItem>>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const { page, pageSize, skip } = normalizePagination(filters);
    const where = buildListWhere(companyId, filters);

    const [rows, total] = await Promise.all([
      prisma.equipmentQualification.findMany({
        where,
        include: listInclude,
        orderBy: [{ qualifiedAt: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.equipmentQualification.count({ where }),
    ]);

    return success(
      toPaginatedResult(rows.map(mapListItem), total, page, pageSize),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function getEquipmentQualificationById(
  companyId: string,
  qualificationId: string,
): Promise<ServiceResult<EquipmentQualificationDetail>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const row = await prisma.equipmentQualification.findFirst({
      where: { id: qualificationId, companyId, ...notDeleted },
      include: {
        ...listInclude,
        assessments: {
          where: notDeleted,
          include: {
            assessment: {
              select: {
                id: true,
                title: true,
                completedAt: true,
              },
            },
          },
        },
      },
    });

    if (!row) {
      return failure(new Error("Equipment qualification not found."));
    }

    return success({
      ...mapListItem({
        ...row,
        assessments: row.assessments.map((item) => ({ id: item.id })),
      }),
      notes: row.notes,
      assessments: row.assessments.map((item) => ({
        id: item.id,
        assessmentId: item.assessment.id,
        title: item.assessment.title,
        completedAt: item.assessment.completedAt,
      })),
    });
  } catch (error) {
    return failure(error);
  }
}

export async function listActiveEquipmentEndorsements(
  companyId: string,
  employeeId: string,
): Promise<ServiceResult<ActiveEndorsement[]>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const rows = await prisma.equipmentQualification.findMany({
      where: {
        companyId,
        employeeId,
        ...notDeleted,
        status: { in: ["ACTIVE", "EXPIRED"] },
      },
      include: { equipmentType: true },
      orderBy: [{ qualifiedAt: "desc" }],
    });

    const active = rows
      .filter((row) => deriveStatus(row.status, row.expiresAt) === "ACTIVE")
      .map((row) => ({
        id: row.id,
        equipmentTypeName: row.equipmentType.name,
        make: row.make,
        model: row.model,
        capacity: row.capacity,
        qualifiedAt: row.qualifiedAt,
        expiresAt: row.expiresAt,
      }));

    return success(active);
  } catch (error) {
    return failure(error);
  }
}

export async function createEquipmentQualification(
  companyId: string,
  input: CreateEquipmentQualificationInput,
  actor: { userId: string; employeeId: string | null },
): Promise<ServiceResult<EquipmentQualificationListItem>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const qualifiedAt = parseDateOnly(input.qualifiedAt);
    if (!qualifiedAt) {
      return failure(new Error("Enter a valid qualification date."));
    }
    const expiresAt = input.expiresAt
      ? parseDateOnly(input.expiresAt)
      : null;
    if (input.expiresAt && !expiresAt) {
      return failure(new Error("Enter a valid expiry date."));
    }

    const [employee, equipmentType] = await Promise.all([
      prisma.employee.findFirst({
        where: { id: input.employeeId, companyId, ...notDeleted },
      }),
      prisma.equipmentType.findFirst({
        where: { id: input.equipmentTypeId, companyId, ...notDeleted },
      }),
    ]);

    if (!employee || !equipmentType) {
      return failure(new Error("Worker or equipment type was not found."));
    }

    if (input.equipmentId) {
      const equipment = await prisma.equipment.findFirst({
        where: { id: input.equipmentId, companyId, ...notDeleted },
      });
      if (!equipment) {
        return failure(new Error("Equipment asset was not found."));
      }
    }

    if (input.assessorId) {
      const assessor = await prisma.employee.findFirst({
        where: { id: input.assessorId, companyId, ...notDeleted },
      });
      if (!assessor) {
        return failure(new Error("Assessor was not found."));
      }
    }

    const assessmentIds = [...new Set(input.assessmentIds ?? [])];
    if (assessmentIds.length > 0) {
      const assessments = await prisma.assessment.findMany({
        where: {
          companyId,
          id: { in: assessmentIds },
          ...notDeleted,
        },
        select: { id: true },
      });
      if (assessments.length !== assessmentIds.length) {
        return failure(new Error("One or more supporting assessments are invalid."));
      }
    }

    const created = await prisma.equipmentQualification.create({
      data: {
        companyId,
        employeeId: input.employeeId,
        equipmentTypeId: input.equipmentTypeId,
        equipmentId: input.equipmentId ?? null,
        assessorId: input.assessorId ?? actor.employeeId ?? null,
        make: input.make.trim(),
        model: input.model.trim(),
        capacity: emptyToNull(input.capacity),
        qualifiedAt,
        expiresAt,
        status: deriveStatus("ACTIVE", expiresAt),
        notes: emptyToNull(input.notes),
        createdById: actor.userId,
        assessments: {
          create: assessmentIds.map((assessmentId) => ({
            assessmentId,
            createdById: actor.userId,
          })),
        },
      },
      include: listInclude,
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId: actor.userId,
        action: "CREATE",
        entityType: "EquipmentQualification",
        entityId: created.id,
        summary: `Qualified worker on ${equipmentType.name}`,
        afterData: {
          employeeId: input.employeeId,
          equipmentTypeId: input.equipmentTypeId,
          make: input.make,
          model: input.model,
        },
      },
    });

    return success(mapListItem(created));
  } catch (error) {
    return failure(error);
  }
}

export async function softDeleteEquipmentQualification(
  companyId: string,
  qualificationId: string,
  actorUserId: string,
): Promise<ServiceResult<{ id: string; employeeId: string }>> {
  const configError = getDatabaseConfigError();
  if (configError) return unavailable(configError);

  try {
    const existing = await prisma.equipmentQualification.findFirst({
      where: { id: qualificationId, companyId, ...notDeleted },
    });
    if (!existing) {
      return failure(new Error("Equipment qualification not found."));
    }

    await prisma.equipmentQualification.update({
      where: { id: qualificationId },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        companyId,
        actorUserId,
        action: "DELETE",
        entityType: "EquipmentQualification",
        entityId: qualificationId,
        summary: "Soft-deleted equipment qualification",
      },
    });

    return success({ id: qualificationId, employeeId: existing.employeeId });
  } catch (error) {
    return failure(error);
  }
}
