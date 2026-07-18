import { z } from "zod";

/** Practical demonstration ratings (subset of AssessmentRating). */
export const demonstrationRatingSchema = z.enum([
  "NOT_OBSERVED",
  "NEEDS_IMPROVEMENT",
  "COMPETENT",
  "EXCEEDS_STANDARD",
]);

const optionalText = (max: number) => z.string().max(max).optional();

export const createDemonstrationSchema = z.object({
  employeeId: z.string().uuid(),
  projectId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  competencyId: z.string().uuid(),
  title: z.string().min(3).max(200).optional(),
  rating: demonstrationRatingSchema,
  comments: optionalText(5000),
  instructorNotes: optionalText(5000),
  workerComments: optionalText(5000),
  instructorSignatureName: z.string().min(2).max(120),
  workerSignatureName: optionalText(120),
});

export type CreateDemonstrationInput = z.infer<typeof createDemonstrationSchema>;

export const demonstrationListFiltersSchema = z.object({
  q: z.string().max(160).optional(),
  employeeId: z.string().uuid().optional(),
  competencyId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  rating: demonstrationRatingSchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type DemonstrationListFiltersInput = z.infer<
  typeof demonstrationListFiltersSchema
>;
