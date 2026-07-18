import { z } from "zod";

export const trainingMatrixDisplayStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPETENT",
  "VERIFIED",
  "NEEDS_REASSESSMENT",
]);

export type TrainingMatrixDisplayStatus = z.infer<
  typeof trainingMatrixDisplayStatusSchema
>;

export const trainingMatrixFiltersSchema = z.object({
  companyId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  trade: z.string().max(120).optional(),
  crew: z.string().max(120).optional(),
  supervisorId: z.string().uuid().optional(),
  status: trainingMatrixDisplayStatusSchema.optional(),
});

export type TrainingMatrixFiltersInput = z.infer<
  typeof trainingMatrixFiltersSchema
>;

export const trainingMatrixExportFormatSchema = z.enum(["xlsx", "pdf"]);

export type TrainingMatrixExportFormat = z.infer<
  typeof trainingMatrixExportFormatSchema
>;
