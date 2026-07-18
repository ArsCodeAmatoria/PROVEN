import { z } from "zod";

export const competencyStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const competencyDifficultySchema = z.enum([
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
]);

const optionalText = (max: number) => z.string().max(max).optional();

const optionalUuid = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

export const competencyListFiltersSchema = z.object({
  q: z.string().max(160).optional(),
  status: z.union([competencyStatusSchema, z.literal("")]).optional(),
  difficulty: z.union([competencyDifficultySchema, z.literal("")]).optional(),
  categoryId: optionalUuid,
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CompetencyListFiltersInput = z.infer<
  typeof competencyListFiltersSchema
>;

export const createCompetencySchema = z.object({
  code: z.string().min(2).max(32),
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(5000),
  categoryId: optionalUuid,
  reference: optionalText(240),
  csaReference: optionalText(240),
  asmeReference: optionalText(240),
  workSafeBcReference: optionalText(240),
  requiredDemonstrations: optionalText(5000),
  requiredDemonstrationCount: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? undefined : value,
    z.coerce.number().int().min(1).max(100).optional(),
  ),
  requiredScore: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? undefined : value,
    z.coerce.number().int().min(0).max(100).optional(),
  ),
  difficulty: competencyDifficultySchema,
  estimatedTimeMinutes: z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? undefined : value,
    z.coerce.number().int().min(1).max(10080).optional(),
  ),
  trade: optionalText(80),
  level: z.coerce.number().int().min(1).max(10),
  status: competencyStatusSchema,
});

export type CreateCompetencyInput = z.infer<typeof createCompetencySchema>;

export const updateCompetencySchema = createCompetencySchema;

export type UpdateCompetencyInput = z.infer<typeof updateCompetencySchema>;

export const createCompetencyCategorySchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  description: optionalText(1000),
  parentId: optionalUuid,
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export type CreateCompetencyCategoryInput = z.infer<
  typeof createCompetencyCategorySchema
>;

export const updateCompetencyCategorySchema = createCompetencyCategorySchema;

export type UpdateCompetencyCategoryInput = z.infer<
  typeof updateCompetencyCategorySchema
>;
