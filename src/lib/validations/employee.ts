import { z } from "zod";

import { USER_ROLES } from "@/types/roles";

export const employeeStatusSchema = z.enum([
  "ACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
]);

export const employeeRoleSchema = z.enum(USER_ROLES);

const optionalText = z.string().max(5000).optional();

const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

export const employeeListFiltersSchema = z.object({
  q: z.string().max(120).optional(),
  status: z.union([employeeStatusSchema, z.literal("")]).optional(),
  trade: z.string().max(80).optional(),
  level: z.coerce.number().int().min(1).max(10).optional(),
  supervisorId: optionalUuid,
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type EmployeeListFiltersInput = z.infer<typeof employeeListFiltersSchema>;

export const createEmployeeSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: optionalText,
  employeeNumber: z.string().max(40).optional(),
  title: z.string().max(120).optional(),
  trade: z.string().max(80).optional(),
  level: z.coerce.number().int().min(1).max(10),
  department: z.string().max(120).optional(),
  role: employeeRoleSchema,
  status: employeeStatusSchema,
  supervisorId: optionalUuid,
  hireDate: z
    .union([z.string().min(1), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  notes: optionalText,
  emergencyContactName: z.string().max(120).optional(),
  emergencyContactPhone: z.string().max(40).optional(),
  emergencyContactRelation: z.string().max(80).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.extend({
  email: z.string().email().optional(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
