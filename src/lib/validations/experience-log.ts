import { z } from "zod";

export const liftTypeSchema = z.enum([
  "NONE",
  "MOBILE_CRANE",
  "TOWER_CRANE",
  "OVERHEAD_CRANE",
  "BOOM_TRUCK",
  "FORKLIFT",
  "AERIAL_LIFT",
  "OTHER",
]);

export const experienceMilestoneKindSchema = z.enum([
  "APPRENTICESHIP",
  "EQUIPMENT",
  "PROJECT",
  "CATEGORY",
  "GENERAL",
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

export const createExperienceLogSchema = z
  .object({
    employeeId: z.string().uuid(),
    projectId: z.string().uuid(),
    supervisorId: optionalUuid,
    equipmentId: optionalUuid,
    categoryId: optionalUuid,
    competencyId: optionalUuid,
    employerName: z.string().min(2).max(160),
    liftType: liftTypeSchema,
    taskPerformed: z.string().min(3).max(500),
    hours: z.coerce.number().positive().max(10000),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    isApprenticeship: z.boolean().default(true),
    notes: optionalText(5000),
  })
  .superRefine((data, ctx) => {
    if (data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be on or after start date.",
        path: ["endDate"],
      });
    }
  });

export type CreateExperienceLogInput = z.infer<typeof createExperienceLogSchema>;

export const createExperienceMilestoneSchema = z.object({
  name: z.string().min(2).max(160),
  description: optionalText(1000),
  kind: experienceMilestoneKindSchema,
  targetHours: z.coerce.number().positive().max(100000),
  categoryId: optionalUuid,
  competencyId: optionalUuid,
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
});

export type CreateExperienceMilestoneInput = z.infer<
  typeof createExperienceMilestoneSchema
>;

export const experienceLogListFiltersSchema = z.object({
  q: z.string().max(160).optional(),
  employeeId: optionalUuid,
  projectId: optionalUuid,
  supervisorId: optionalUuid,
  equipmentId: optionalUuid,
  categoryId: optionalUuid,
  liftType: liftTypeSchema.optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type ExperienceLogListFiltersInput = z.infer<
  typeof experienceLogListFiltersSchema
>;
