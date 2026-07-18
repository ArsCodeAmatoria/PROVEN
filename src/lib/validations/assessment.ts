import { z } from "zod";

export const assessmentRatingSchema = z.enum([
  "PASS",
  "NEEDS_IMPROVEMENT",
  "COMPETENT",
  "EXCEEDS_STANDARD",
  "NOT_OBSERVED",
]);

export const assessmentSignerRoleSchema = z.enum([
  "INSTRUCTOR",
  "APPRENTICE",
  "WITNESS",
]);

export const assessmentTypeSchema = z.enum([
  "PRACTICAL",
  "WRITTEN",
  "OBSERVATION",
  "PORTFOLIO",
  "ORAL",
  "CONTINUOUS",
]);

const optionalText = (max: number) => z.string().max(max).optional();

export const createAssessmentEngineSchema = z.object({
  employeeId: z.string().uuid(),
  projectId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  competencyId: z.string().uuid(),
  type: assessmentTypeSchema,
  title: z.string().min(3).max(200).optional(),
  rating: assessmentRatingSchema,
  comments: optionalText(5000),
  instructorNotes: optionalText(5000),
  apprenticeComments: optionalText(5000),
  instructorSignatureName: z.string().min(2).max(120),
  apprenticeSignatureName: optionalText(120),
});

export type CreateAssessmentEngineInput = z.infer<
  typeof createAssessmentEngineSchema
>;

export const assessmentListFiltersSchema = z.object({
  q: z.string().max(160).optional(),
  employeeId: z.string().uuid().optional(),
  competencyId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  rating: assessmentRatingSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type AssessmentListFiltersInput = z.infer<
  typeof assessmentListFiltersSchema
>;
