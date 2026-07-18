import { z } from "zod";

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
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    companyName: z.string().min(2).max(120),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(40).optional().or(z.literal("")),
  title: z.string().max(120).optional().or(z.literal("")),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const userSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  assessmentReminders: z.boolean(),
  rememberMeDefault: z.boolean(),
  timezone: z.string().min(2).max(80),
  locale: z.string().min(2).max(16),
});

export type UserSettingsInput = z.infer<typeof userSettingsSchema>;

export const companyUpdateSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(40).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  address: z.string().max(240).optional().or(z.literal("")),
});

export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;

export {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeListFiltersSchema,
  employeeStatusSchema,
  employeeRoleSchema,
  type CreateEmployeeInput,
  type UpdateEmployeeInput,
  type EmployeeListFiltersInput,
} from "./employee";

export {
  createCompetencySchema,
  updateCompetencySchema,
  competencyListFiltersSchema,
  competencyStatusSchema,
  competencyDifficultySchema,
  createCompetencyCategorySchema,
  updateCompetencyCategorySchema,
  type CreateCompetencyInput,
  type UpdateCompetencyInput,
  type CompetencyListFiltersInput,
  type CreateCompetencyCategoryInput,
  type UpdateCompetencyCategoryInput,
} from "./competency";
