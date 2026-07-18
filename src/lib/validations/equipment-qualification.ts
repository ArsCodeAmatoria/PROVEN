import { z } from "zod";

export const equipmentQualificationStatusSchema = z.enum([
  "ACTIVE",
  "EXPIRED",
  "SUSPENDED",
  "REVOKED",
]);

const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined));

export const createEquipmentQualificationSchema = z.object({
  employeeId: z.string().uuid(),
  equipmentTypeId: z.string().uuid(),
  equipmentId: optionalUuid,
  assessorId: optionalUuid,
  make: z.string().min(1).max(120),
  model: z.string().min(1).max(120),
  capacity: optionalText(120),
  qualifiedAt: z.string().min(1),
  expiresAt: z
    .union([z.string().min(1), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  notes: optionalText(5000),
  assessmentIds: z.array(z.string().uuid()).max(20).default([]),
});

export type CreateEquipmentQualificationInput = z.infer<
  typeof createEquipmentQualificationSchema
>;

export const equipmentQualificationListFiltersSchema = z.object({
  q: z.string().max(160).optional(),
  employeeId: optionalUuid,
  equipmentTypeId: optionalUuid,
  status: equipmentQualificationStatusSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type EquipmentQualificationListFiltersInput = z.infer<
  typeof equipmentQualificationListFiltersSchema
>;
