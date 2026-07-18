import { z } from "zod";

export const observationTypeSchema = z.enum([
  "POSITIVE_OBSERVATION",
  "COACHING_OPPORTUNITY",
  "COMPETENT_DEMONSTRATION",
  "UNSAFE_ACT",
  "UNSAFE_CONDITION",
  "NEAR_MISS",
  "FOLLOW_UP_REQUIRED",
]);

export const observationFollowUpStatusSchema = z.enum([
  "NONE",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
]);

const optionalText = (max: number) => z.string().max(max).optional();

const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

export const createObservationSchema = z.object({
  employeeId: z.string().uuid(),
  projectId: z.string().uuid(),
  categoryId: optionalUuid,
  competencyId: optionalUuid,
  observationType: observationTypeSchema,
  location: optionalText(240),
  context: z.string().min(3).max(200),
  comments: optionalText(5000),
  correctiveActions: optionalText(5000),
  dueDate: z
    .union([z.string().min(1), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  followUpStatus: observationFollowUpStatusSchema,
  observedDate: z.string().min(1),
  observedTime: z.string().min(1),
});

export type CreateObservationInput = z.infer<typeof createObservationSchema>;

export const updateObservationFollowUpSchema = z.object({
  comments: optionalText(5000),
  correctiveActions: optionalText(5000),
  dueDate: z
    .union([z.string().min(1), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  followUpStatus: observationFollowUpStatusSchema,
});

export type UpdateObservationFollowUpInput = z.infer<
  typeof updateObservationFollowUpSchema
>;

export const observationListFiltersSchema = z.object({
  q: z.string().max(160).optional(),
  employeeId: optionalUuid,
  projectId: optionalUuid,
  observationType: observationTypeSchema.optional(),
  followUpStatus: observationFollowUpStatusSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type ObservationListFiltersInput = z.infer<
  typeof observationListFiltersSchema
>;
