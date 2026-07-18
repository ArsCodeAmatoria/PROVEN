import { z } from "zod";

export const createCompetencySchema = z.object({
  code: z.string().min(2).max(32),
  title: z.string().min(3).max(160),
  description: z.string().min(10).max(2000),
  category: z.string().min(2).max(80),
  trade: z.string().min(2).max(80),
  level: z.coerce.number().int().min(1).max(5),
});

export type CreateCompetencyInput = z.infer<typeof createCompetencySchema>;

export const createAssessmentSchema = z.object({
  competencyId: z.string().cuid(),
  assesseeId: z.string().cuid(),
  assessorId: z.string().cuid(),
  evidenceNotes: z.string().max(5000).optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;

export const createExamSchema = z.object({
  code: z.string().min(2).max(32),
  title: z.string().min(3).max(160),
  description: z.string().max(2000).optional(),
  passingScore: z.coerce.number().int().min(1).max(100),
  timeLimitMin: z.coerce.number().int().min(5).max(480).optional(),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

export const createApprenticeshipSchema = z.object({
  apprenticeId: z.string().cuid(),
  mentorId: z.string().cuid().optional(),
  programName: z.string().min(3).max(160),
  trade: z.string().min(2).max(80),
  startDate: z.coerce.date(),
  targetEndDate: z.coerce.date().optional(),
  hoursRequired: z.coerce.number().int().min(1).max(10000),
});

export type CreateApprenticeshipInput = z.infer<
  typeof createApprenticeshipSchema
>;

export const createObservationSchema = z.object({
  observedId: z.string().cuid(),
  observerId: z.string().cuid(),
  apprenticeshipId: z.string().cuid().optional(),
  context: z.string().min(3).max(160),
  rating: z.enum(["EXCEEDS", "MEETS", "DEVELOPING", "DOES_NOT_MEET"]),
  notes: z.string().min(10).max(5000),
  observedAt: z.coerce.date().optional(),
});

export type CreateObservationInput = z.infer<typeof createObservationSchema>;

export const createCertificationSchema = z.object({
  profileId: z.string().cuid(),
  name: z.string().min(3).max(160),
  issuer: z.string().min(2).max(160),
  credentialId: z.string().max(120).optional(),
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  documentUrl: z.string().url().optional(),
});

export type CreateCertificationInput = z.infer<
  typeof createCertificationSchema
>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;
